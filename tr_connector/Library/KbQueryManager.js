const ABuffer = require("./ABuffer.js");
const AQuery = require("./AQuery.js");
const KbQueryData = require("./KbQueryData.js");
const BP = require("./BP.js");
/**
Constructor
Do not call Function in Constructor.
*/
function KbQueryManager(name) {
  this.name = name;			//매니저를 구분 짓는 이름
  this.netIo = null;			//io 전송 방식에 따른 객체 저장
  this.reqSN = 0;
  
  this.sndBuf = null;			//전송용 ABuffer 객체
  this.rcvBuf = null;			//수신용 ABuffer 객체
  this.queryListeners = [];	//IO 이벤트를 수신할 객체들을 모아둔 배열
  this.realComps = {};		//리얼 데이터를 수신할 컴포넌트 모음

  //초기화	
  this.headerInfo = null;
  this.setHeaderInfo();

  this.errorData = 
  {
    trName: '',
    errCode: '',	//메시지코드/오류코드
    errMsg: ''		//에러 메시지
  };

  //수신 패킷 정보
  this.packetInfo = 
  {
    packetType: 0,
    packetId: 0, 
    menuNo: '', 
    groupName: '',
    trName: ''
  };

  //전송 패킷 정보
  this.sendInfo = 
  {
  packetType: 0,
  packetId: 0, 
  menuNo: '', 
  groupName: '', 
  trName: ''
  };


  this.publicKey = null;
  this.sessionKey = null;

  this.packetId = 0;

  this.isShowProgress = true;
  this.isVisibleUpdate = true;	//보여질 경우만 데이터를 업데이트를 하는 옵션

  this.errCodeMap = {};
  this.queryCallbacks = {};
  this.realProcMap = {};

  this.mediaGubun = '34W'; //MD_GB
  this.SRC_M = '';
  this.SRC_G = 0;
  this.SRC_L = 0;
  this.htsLoginType = '';
  this.loginCertInfo = {};

  this.trWaitArr = [];
  this.isSessionDone = 0;

  //타임아웃 처리를 원래 위치가 아닌 다른 위치에서 해야하므로 임시로 KbQueryManager에서 자체처리한다.
  this.timeoutSec = 0;
  this.kbTimeoutSec = 15;
}

realCallbacks = {};


KbQueryManager.prototype.setQueryBuffer = function(sendSize, recvSize, charSet, emptyChar, emptyNumChar)
{
	this.sndBuf = new ABuffer(sendSize);
	this.sndBuf.setCharset(charSet);
	
	this.rcvBuf = new ABuffer(recvSize);
	this.rcvBuf.setCharset(charSet);
	
	if(emptyChar!=undefined && emptyChar!=null)  
	{
		this.sndBuf.setEmptyChar(emptyChar);
		this.rcvBuf.setEmptyChar(emptyChar);
	}
	
	if(emptyNumChar!=undefined && emptyNumChar!=null) 
	{
		this.sndBuf.setEmptyNumChar(emptyNumChar);
		this.rcvBuf.setEmptyNumChar(emptyNumChar);
	}
};

KbQueryManager.prototype.setNetworkIo = function(netIo)
{
	this.netIo = netIo;
};

KbQueryManager.prototype.onClosed = function() {
  this.isSessionDone = 0;
};


KbQueryManager.prototype.setHeaderInfo = function(headerInfo) {
  if (headerInfo) {
    QueryManager.prototype.setHeaderInfo.call(this, headerInfo);
  } else {
    //파라미터가 null 인 경우 초기화
    this.headerInfo = {};
  }
};

//전송헤더 이후의 데이터 셋팅 오프셋을 리턴한다.
KbQueryManager.prototype.getInDataOffset = function(aquery, queryData) {
  let offset;
  if (aquery.getQueryType() == '.Func') offset = BP.SZ_VTRAN_SND_TOTAL_HEADER;
  else {
    offset = BP.SZ_DTRAN_TOTAL_HEADER;
    if (queryData.e2ePwd) offset += BP.SZ_E2E_PWD;

    //if (queryData && queryData.getAccPwHash && queryData.getAccPwHash()) offset += SZ_E2E_PWD;
  }

  return offset;
};

//수신헤더 이후의 데이터 셋팅 오프셋을 리턴한다.
KbQueryManager.prototype.getOutDataOffset = function(aquery) {
  if (aquery.getQueryType() == '.Func') return BP.SZ_VTRAN_RCV_TOTAL_HEADER;
  else return BP.SZ_DTRAN_TOTAL_HEADER;
};

//사용할 AQueryData(또는 상속받은 클래스) 객체를 생성하여 리턴한다.
KbQueryManager.prototype.makeQueryData = function(aquery, isSend) {
  return new KbQueryData(aquery);
};

//상속 받아 다음과 같은 패턴으로 구현한다.
KbQueryManager.prototype.onReceived = function(data) {
  //  1. this.rcvBuf 를 생성한다. 생성방법은 상황에 따라 다름.
  const abuf = this.rcvBuf;
  const size = data.byteLength;
  abuf.copyBuffer(data, 0);
  abuf.setDataSize(size);

  //00001*
  if (size < BP.SZ_COMMON_HEADER) return;

  //  2. 패킷 타입과 패킷 아이디를 셋팅한다.
  this.packetInfo.func = abuf.getOriString(BP.OS_FUNCTION, BP.SZ_FUNCTION);

  abuf.setOffset(BP.OS_FUNCTION+BP.SZ_FUNCTION);

  if (['V','F','O','D'].includes(this.packetInfo.func)) {

    this.packetInfo.md_gb = abuf.nextOriString(BP.SZ_MD_GB);  //거래소용1(1:영업점단말,2:유선단말,3:무선단말,4:HTS,9:기타) + 내부코드2
    this.packetInfo.ec_gb = abuf.nextOriString(BP.SZ_EC_GB);
    this.packetInfo.s_gb = abuf.nextOriString(BP.SZ_S_GB);
    this.packetInfo.filer = abuf.nextOriString(BP.SZ_FILER);

    if (this.packetInfo.func != 'D') {
      this.packetInfo.con_seq = abuf.getOriString(BP.OS_VCOMMON_CON_SEQ, BP.SZ_VCOMMON_CON_SEQ);
      this.packetInfo.sub_func = abuf.getOriString(BP.OS_VCOMMON_SUB_FUNC, BP.SZ_VCOMMON_SUB_FUNC);
      this.packetInfo.packetId = abuf.getWord(BP.OS_VCOMMON_RQ_ID);
      this.packetInfo.result = abuf.getOriString(BP.OS_VCOMMON_RESULT, BP.SZ_VCOMMON_RESULT);
      this.packetInfo.filler = abuf.getOriString(BP.OS_VCOMMON_FILLER, BP.SZ_VCOMMON_FILLER);

      //this.printBySize(SIZE_VCOMMON_INFO, BP.SZ_COMMON_HEADER);
      abuf.setOffset(BP.OS_VCOMMON_FILLER+BP.SZ_VCOMMON_FILLER);
    } else {
      this.packetInfo.con_seq = abuf.getOriString(BP.OS_DTRAN_CON_SEQ, BP.SZ_DTRAN_CON_SEQ);
      this.packetInfo.packetId = abuf.getParseInt(BP.OS_DTRAN_HANDLE, BP.SZ_DTRAN_HANDLE);
      this.packetInfo.result = ''; //abuf.getOriString(BP.OS_VCOMMON_RESULT, BP.SZ_VCOMMON_RESULT);
      this.packetInfo.filler = ''; //abuf.getOriString(BP.OS_VCOMMON_FILLER, BP.SZ_VCOMMON_FILLER);

      abuf.setOffset(BP.SZ_DTRAN_TOTAL_HEADER);
    }
  }

  const func = this.packetInfo.func;
  if (func == 'O') this.realProcess();
};

//keyArr = [ KR004LTC__USD__, KR004LTC__USD__,  ... ], 
//이것은 서버에게, 설정한 키값과 관련된 값이 변경되면 리얼을 전송해 달라고 요청하기 위한 값이다.
//서버에서는 키값과 관련되어져 있는 값이 변경되면 리얼을 내려준다. 사용하지 않으면 [''], realDataToComp 호출 시 key 값을 '' 로 넣어줌.
//compArr = [acomp, acomp, ...]
//updateType : -1/prepend, 0/update, 1/append
KbQueryManager.prototype.registerReal = function(aquery, realField, keyArr, compArr, updateType, callback, afterUpdate)
{
	var i, j, regArr = [], comp, dataKey;
	if(typeof(aquery)=='string') aquery = AQuery.getSafeQuery(aquery);
  if (!aquery) return;

	for(i=0; i<keyArr.length; i++)
	{
		dataKey = aquery.getName() + keyArr[i];
        realCallbacks[dataKey] = callback;
	}

	this.sendRealSet(aquery, true, keyArr);
};

//리얼 등록/해제 패킷 전송 함수... 재정의 하기, unregisterReal 함수 내에서 호출함
//isSet true:등록, false:해제
KbQueryManager.prototype.sendRealSet = function(aquery, isSet, regArr) {
  const abuf = this.sndBuf;
  const queryData = this.makeQueryData(aquery, true);
  //header setting
  let sub_func;

  if(aquery.getQueryType() == '.Push') return;

  //실시간 전송 데이터 위치 세팅
  abuf.setOffset(BP.SZ_VCOMMON_TOTAL_HEADER);

  sub_func = isSet?'A':'B';
  abuf.addOriString(BP.SZ_VTRAN_TR_CD, aquery.getName());
  regArr.forEach((item) => {
    abuf.addOriString(BP.SZ_REAL_KEY, item);
  });
  const sendLen = abuf.getOffset();
  abuf.setDataSize(sendLen);

  queryData.setHeaderInfo({ SUB_FUNC: sub_func });
  this.makeVCommonHeader(queryData, abuf);
  this.sendBufferData(abuf.subDataArray());
};

//onReceive 함수 내에서 패킷 타입에 따라 분기하여 호출되는 함수
KbQueryManager.prototype.realProcess = function() {
  const abuf = this.rcvBuf;
  abuf.setOffset(BP.SZ_VCOMMON_TOTAL_HEADER);

  const cnt = abuf.nextParseInt(3);    //CNT
  let len, trcd, code, aquery, queryData, outblock;

  for (let i=0; i<cnt; i++) {
    len = abuf.nextParseInt(5);
    if(!len) {
      console.error('wrong data after offset 40 [' + abuf.getString(40, abuf.getDataSize()-40) + ']');
      break;
    }

    trcd = abuf.nextOriString(8);
    aquery = AQuery.getSafeQuery(trcd);

    code = abuf.nextOriString(BP.SZ_REAL_KEY);  
    if (aquery.getQueryType() != '.Push') abuf.addOffset(1); //한자리 공백

    queryData = this.makeQueryData(aquery);

    //현재는 강제로 isReal을 넣고 queryData 에서 isReal 값에 따라 다른 처리를 한다.
    //이 부분을 쿼리정보로 알 수 있을지는 확인이 필요
    queryData.isReal = true;
    queryData.outBlockData(abuf, abuf.getOffset());

    //실시간키는 따로 넣어줘야한다.
    outblock = queryData.getBlockData('OutBlock1')[0];
    outblock.rl_tm_key = code;

    //this.realDataToComp(code, queryData);
    var dataKey = queryData.getQueryName() + code;
    realCallbacks[dataKey](queryData);
  }
};

KbQueryManager.prototype.makePacketId = function() {
  //if (this.packetId > 0xffff) this.packetId = 0;
  if (this.packetId > 0x270f) this.packetId = 0;
  return ++this.packetId;
};

//서버에 데이터를 송신하기 전에 호출되어 헤더 정보를 세팅한다.
KbQueryManager.prototype.makeCommonHeader = function(queryData, abuf, menuNo) {
  const packetId = this.makePacketId();
  const aquery = queryData.getQuery();
  let qryHeaderInfo = null;

  abuf.fillBuffer(0x20, BP.SZ_COMMON_HEADER);

  abuf.setNumString(BP.OS_LENGTH, BP.SZ_LENGTH, abuf.getOffset() - BP.SZ_LENGTH);

  qryHeaderInfo = queryData.headerInfo['FUNCTION'];
  if (!qryHeaderInfo) qryHeaderInfo = 'V';
  abuf.addChar(qryHeaderInfo); //기본값은 V로 지정, 파일관련 처리할 때는 FUNCTION 값을 F로 지정해야함

  //"/Query/XXXXXXXX.res" 파일의 tr_info 정보를 목적지로 하여 전송한다.
  qryHeaderInfo = aquery?aquery.getValue('tr_info'):'NIVS01';
  if (!qryHeaderInfo) qryHeaderInfo = 'NIVS01';
  abuf.addOriString(BP.SZ_DEST, qryHeaderInfo);

  //최초에 Status 패킷에서 정보를 추출하여 저장해 놓고 계속 사용한다.
  abuf.addOriString(4, this.SRC_M);
  abuf.addByte(this.SRC_G);
  abuf.addByte(this.SRC_L);

  abuf.setOriString(BP.OS_MD_GB, BP.SZ_MD_GB, this.mediaGubun); //2020.07.01 신규매체코드명:SPEC 신규매체코드: 34W

  const encFlag = 0;
  const ec_gb = (encFlag&1) + (queryData.getFlag('zipFlag')&2);
  abuf.addChar(ec_gb.toString());    //0:일반 1:암호 2:압축 3:암호+압축

  qryHeaderInfo = queryData.headerInfo['S_GB'];
  if (!qryHeaderInfo) qryHeaderInfo = queryData.getSignInfo().signFlag;
  abuf.addChar(qryHeaderInfo.toString());  //공동인증구분
  //0: 인증과 무관
  //1: 최초 인증
  //2: 전체 인증
  //3: 축약인증(HTS용) 
  //4: 축약인증(WEB용)

  // abuf 객체의 메서드들을 이용하고 패킷아이디를 리턴한다.
  return packetId;
};

KbQueryManager.prototype.makeVCommonHeader = function(queryData, abuf, menuNo)
{
  abuf.fillBuffer(0x20, BP.SZ_VCOMMON_TOTAL_HEADER);

  const packetId = this.makeCommonHeader(queryData, abuf, menuNo);
  const aquery = queryData.getQuery();
  let qryHeaderInfo;

  abuf.setChar(BP.OS_VCOMMON_POSITION, 'O');                //F, M, L, O
  abuf.setOriString(BP.OS_VCOMMON_CON_SEQ, BP.SZ_VCOMMON_CON_SEQ, '00');   //FML 인 경우 01~99 순서대로 입력 99 넘는 경우 00부터 다시 시정

  qryHeaderInfo = queryData.headerInfo['SUB_FUNC'];
  if (!qryHeaderInfo) qryHeaderInfo = 'E';
  abuf.setChar(BP.OS_VCOMMON_SUB_FUNC, qryHeaderInfo);
  abuf.setWord(BP.OS_VCOMMON_RQ_ID, packetId);
  //abuf.setChar(BP.OS_VCOMMON_RESULT, ''); //파일요청응답 결과 '0':실패, '1':성공
  //파일상태응답 결과 '0':실패, '1':성공
  //abuf.setChar(BP.OS_VCOMMON_FILLER, '');

  return packetId;
};

//-----------------------------------------------------------------------------------------------------
// RECEIVE PROCESS

KbQueryManager.prototype.unregisterReal = function(aquery, keyArr)
{
	var i, j, comp, dataKey;
	
	if(typeof(aquery)=='string') aquery = AQuery.getSafeQuery(aquery);
	this.sendRealSet(aquery, false, keyArr);
};

KbQueryManager.prototype.onConnected = function(success) {
  console.log('Connect:',success);
};

KbQueryManager.prototype.sendProcess = function(aquery, menuNo, groupName, beforeInBlockBuffer, afterOutBlockData, afterUpdateComponent) {
  if(this.isSessionDone > 0) QueryManager.prototype.sendProcess.call(this, aquery, menuNo, groupName, beforeInBlockBuffer, afterOutBlockData, afterUpdateComponent);
  else this.trWaitArr.unshift(arguments);
};

KbQueryManager.prototype.startManager = function(address, port) {
	if(this.netIo) this.netIo.startIO(address, port);
};

//세션 관련 처리가 완료된 경우 호출하는 함수
//1. 최초에 접속하여 onConnected 이후 실제로 정보를 조회한 후 호출
//2. 다른 웹뷰에 접근하여 세션정보가 이미 있고 다시 조회하기 위해서 처리
KbQueryManager.prototype.onSessionDone = function() {
  this.isSessionDone = 1;


  if (this.isSessionDone > 0) {
    let trWait;
    while(this.trWaitArr.length) {
      trWait = this.trWaitArr.pop();
      this.sendProcess.apply(this, trWait);
    }
  }
};

KbQueryManager.prototype.makeTimeout = function(packetId) {
  if (packetId == undefined) return;
  if (this.kbTimeoutSec>0) {
    var thisObj = this;

    const cbObj = this.queryCallbacks[packetId];
    if(!cbObj) return;
    cbObj.timeout = setTimeout(function() {
      if(thisObj.isShowProgress) AIndicator.hide();

      thisObj.errorData.trName = cbObj.trName;
      thisObj.errorData.errCode = 10001;
      //thisObj.errorData.errMsg = '서버와의 접속이 지연되고 있습니다.';
      //thisObj.errorData.errMsg = '통신 상태가 원활하지 않습니다.(1) : ' + thisObj.errorData.trName + ',' + cbObj.menuNo + ',' + cbObj.groupName;
      thisObj.errorData.errMsg = '통신 상태가 원활하지 않습니다.';

      //콜백 객체 제거
      thisObj.getQueryCallback(packetId);

      //타임아웃
      if(cbObj.func) cbObj.func.call(thisObj, null);
      //if(listener && listener.afterOutBlockData) listener.afterOutBlockData(null, groupName, thisObj.errorData.trName, thisObj);

      const qLen = thisObj.queryListeners.length;
      let listener;
      for(i=0; i<qLen; i++)
      {
        listener = thisObj.queryListeners[i];

        if(listener.afterRecvBufferData) listener.afterRecvBufferData(thisObj);
        if(listener.afterOutBlockData) listener.afterOutBlockData(null, thisObj);
      }


    }, this.kbTimeoutSec*1000);
  }
};

KbQueryManager.prototype.sendBufferData = function(buf, packetId) {
  this.makeTimeout(packetId);
  this.netIo.write(buf);
};

module.exports = KbQueryManager;