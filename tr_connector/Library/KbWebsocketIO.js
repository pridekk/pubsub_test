const ABuffer = require("./ABuffer.js");
const BP = require("./BP.js");
/**
Constructor
Do not call Function in Constructor.
*/
function KbWebsocketIO(listener, isSSL)
{
	this.listener = listener;
	this.retryCount = 0;
	this.retryTime = 0;
	this.curCount = 0;
	this.selfClose = false;
	
	this.socket = null;
	this.protocols = undefined;
	this.isSSL = isSSL;
  
  this.sndChnBuf = new ABuffer(BP.SZ_MAX_PACKET);
  
  this.chnObj = {};
  this.chnBufArr = [];
  
  this.abuf = new ABuffer(1024*2048);
  this.packetSize = 0;
  this.data = new Uint8Array(0);
  
  this.chainOffset = BP.SZ_VTRAN_RCV_TOTAL_HEADER;
}

KbWebsocketIO.prototype.getBuffer = function()
{
  var abuf = this.chnBufArr.shift();
  if (!abuf) abuf = new ABuffer(1024*2048);
  
  return abuf;
};

KbWebsocketIO.prototype.returnBuffer = function(abuf)
{
  this.chnBufArr.push(abuf);
};

KbWebsocketIO.prototype.getChainBuffer = function(packetId)
{
  var arr = this.chnObj[packetId];
  if (!arr) arr = this.chnObj[packetId] = this.getBuffer();
  
  return arr;
};

KbWebsocketIO.prototype.returnChainBuffer = function(packetId, abuf)
{
  delete this.chnObj[packetId];
  this.returnBuffer(abuf);
};

KbWebsocketIO.prototype.getLength = function(arr, offset) {
  
  var ret = '';
  for(var i=0; i<5; i++)
    ret += String.fromCharCode(arr[offset+i]);

  return parseInt(ret, 10)+5;
};

KbWebsocketIO.prototype.onReceived = function(data)
{
  //데이터를 수신하면 this.data 의 뒷부분에 계속 쌓는다.
  data = new Uint8Array(data);
  this.data = new Uint8Array([...this.data, ...data]);
  
  let packetSize = 0;
  while (true) {
    packetSize = this.getLength(this.data, 0);
    
    //명시된 패킷사이즈가 숫자가 아니면 리턴한다.
    if (isNaN(packetSize)) return;
    //명시된 패킷사이즈가 수신받은 데이터 사이즈보다 큰 경우 계속 기다린다.
    if (packetSize > this.data.length) return;
    
    this.onePacketReceived(this.data.subarray(0, packetSize));
    this.data = this.data.subarray(packetSize, this.data.length);
    
    //데이터가 없으면 리턴한다.
    if (this.data.length == 0) return;
  }
};

KbWebsocketIO.prototype.onePacketReceived = function(data) {
  let lastBuf = this.abuf;
  let chnId;
  let packetSize = data.length;
  
  //하나의 패킷사이즈가 공통헤더 사이즈(30) 보다 작은 경우 아무런 처리를 하지 않는다.
  if (packetSize < BP.SZ_COMMON_HEADER) return;
  
  lastBuf.copyBuffer(data, 0);
  lastBuf.setDataSize(packetSize);

  const func = lastBuf.getOriString(BP.OS_FUNCTION, BP.SZ_FUNCTION);
  const packetId = lastBuf.getWord(BP.OS_VCOMMON_RQ_ID);

  //-----------------------------------------------------------------
  //  여기부터 패킷 컨트롤 시작
  //-----------------------------------------------------------------

  //[mRecvBufUtil setBuffer:lastBuf size:RECV_BUFSIZE];
  const flag = lastBuf.getParseInt(BP.OS_EC_GB, BP.SZ_EC_GB);

  //암호화, 압축은 패킷 체인인 경우 따로따로 압축해제, 복호화를 해야함. --> 확인필요
  //암호화 여부, 압축 여부
  const isEnc = flag&0x01;
  const isZip = flag&0x02;

  //console.log('isEnc : ' + isEnc + ' isZip : ' + isZip);


  this.checkPacketChain(lastBuf, packetSize, packetId);
};

KbWebsocketIO.prototype.checkPacketChain = function(lastBuf, packetSize, packetId) {
  let chnBuf, tmp, chnId, copySize, data;
  const cFlag = lastBuf.getOriString(BP.OS_VCOMMON_POSITION, BP.SZ_VCOMMON_POSITION);
  const cSeq = lastBuf.getParseInt(BP.OS_VCOMMON_CON_SEQ, BP.SZ_VCOMMON_CON_SEQ);

  //패킷 체인 처리
  if (['F', 'M', 'L'].includes(cFlag)) {
    chnBuf = this.getChainBuffer(packetId);
    tmp = chnBuf.getOffset();
    chnId = chnBuf.getWord(BP.OS_VCOMMON_RQ_ID);
    chnBuf.setOffset(tmp);
  }

  //console.log('-------------------------------------> ' + flag);

  switch (cFlag) {
      //마지막 체인 패킷
    case 'L': {
      if (chnBuf.getOffset()==0) return;
      if (chnId != packetId) return;

      copySize = packetSize - this.chainOffset;
      chnBuf.addBinary(copySize, lastBuf.subArray(this.chainOffset, packetSize));

      packetSize = chnBuf.getOffset();

      //헤더에 새로운 사이즈 세팅
      //BP.SZ_LENGTH 보다 긴 경우 값이 FUNCTION 영역을 덮음
      //chnBuf.setOriString(BP.OS_LENGTH, BP.SZ_LENGTH, packetSize-BP.SZ_LENGTH);  //패킷 길이-5
      chnBuf.setOffset(0);

      chnBuf.setDataSize(packetSize);
      lastBuf = chnBuf;

      //사용한 chnBuf 를 반환한다.
      this.returnChainBuffer(packetId, chnBuf);
    }
      break;

      //첫번째 체인 패킷은 전체를 복사
    case 'F': {
      chnBuf.setBinary(0, packetSize, lastBuf.subArray(0, packetSize));
    }
      return;

      //중간 패킷
    case 'M': {
      copySize = packetSize - this.chainOffset;
      chnBuf.addBinary(copySize, lastBuf.subArray(this.chainOffset, packetSize));
    }
      return;
  }

  //Uint8Array 로 데이터 전달
  data = lastBuf.subDataArray();
	if(this.listener) this.listener.onReceived(data, packetSize);
};

module.exports = KbWebsocketIO;