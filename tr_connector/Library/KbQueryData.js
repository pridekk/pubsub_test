const AQueryData = require("./AQueryData.js");
const AQuery = require("./AQuery.js");
/**
Constructor
Do not call Function in Constructor.
*/
function KbQueryData(aquery) {
  AQueryData.call(this, aquery);

  this.flagObj = {
    encFlag: false,    // 암호화 구분 코드 -> 평문:false 암호화:true
    zipFlag: false    // 압축 구분 코드 -> 압축X:false 압축:true
  };

  //this.signFlag = 0;  // 공동인증서 서명처리여부
							//0: 인증과 무관
							//1: 최초 인증
							//2: 전체 인증
							//3: 축약인증(HTS용) 
							//4: 축약인증(WEB용)
							//6: 카카오인증
							//7: 카카오축약인증
  this.signInfo = { signFlag: '0'};
}
afc.extendsClass(KbQueryData, AQueryData);

//e2ePwd : 계좌번호+비밀번호 암호화 처리한 비밀번호
//축약서명 자동처리
KbQueryData.prototype.setPassword = function(blockName, fieldName, e2ePwd, isBriefSign) {
  if (theApp.isNative) {
    if (isBriefSign) this.setSignInfo('3');
    this.setFlag('encFlag', true);
    this.getBlockData(blockName)[0][fieldName] = '********';
    this.e2ePwd = e2ePwd;
  } else {
    this.getBlockData(blockName)[0][fieldName] = e2ePwd;
  }
};

// 전자서명 관련
// signFLag : 0:X, 1: 최초인증, 2:전체 인증, 3:축약인증(HTS용) 4:축약인증(WEB용) 6:카카오인증 7:카카오축약인증
// certSerialNumber : 인증서 SerialNumber
// certDn : 인증서 DN 값
// isAutoSign : 저장된 인증서 정보로 자동 서명처리여부
KbQueryData.prototype.setSignInfo = function(signFlag, certSerialNumber, certDn, isAutoSign) {
  this.setFlag('encFlag', true);
  if (theApp.isNative) {
    if (signFlag == '3') {
	  if (theApp.qm.htsLoginType) {
	    if (theApp.qm.htsLoginType != 'cert') signFlag = '7';
	  } else return;
	}
    this.signInfo = {signFlag, certSerialNumber, certDn, isAutoSign};
  }
};

//공동인증 서명여부
KbQueryData.prototype.getSignInfo = function() {
  return this.signInfo;
};

KbQueryData.prototype.outBlockOccurs = function(block, prevData, abuf) {
  const qryType = this.getQuery().getQueryType();
  if (qryType == '.Strt') {
    var count, tmp;
    if(!block.occurs || block.occurs < 2) count = 1;
    else {
      if(block.occursRef)
      {
        tmp = block.occursRef.split('.');
        count = parseInt(this.getBlockData(tmp[0])[0][tmp[1]], 10);
      }
      else
      {
        for(var key in prevData)
        {
          // 현재로서는 gridCnt00의 field id 를 확실하게 모르므로 아래처럼 처리
          if(key.indexOf('gridCnt') > -1)
          {
            count = parseInt(prevData[key], 10);
            break;
          }
        }
      }
    }
    return count;
  } else {
    let nextOffsetSize;
    //** aquery load 시에 size를 넣어놓을지 생각해보기
    if (!block.size) {
      var attr = this.aquery.getValue('attr')?1:0;
      var format = block.format;
      block.size = 0;

      //실시간TR은 최초에 rl_tm_key 항목을 제거한다.
      if (this.isReal && format[0][AQuery.IKEY] == 'rl_tm_key') format.shift();

      for(var i=0; i<format.length; i++)
      {
        block.size += parseInt(format[i][AQuery.ISIZE]) + attr;
      }
    }

    if (qryType == '.Func') {
      nextOffsetSize = abuf.nextParseInt(8);
    } else { //if (qryType == '.Feed'){
      var offset = abuf.getOffset(),
        sz_len = 5,
        sz_tr_cd_blank = 8+40;
		if (qryType != '.Push') sz_tr_cd_blank += 1;
        nextOffsetSize = abuf.getParseInt(offset - sz_len - sz_tr_cd_blank, 5) - sz_tr_cd_blank;
		abuf.setOffset(offset);
    }

    //** 수신한 데이터에서 명시한 사이즈와 TR의 Output 사이즈가 다른 경우 확인 필요
    if ((nextOffsetSize / block.size) != parseInt(nextOffsetSize / block.size)) {
      console.error('사이즈 안맞음 확인 필요');
    }

    return parseInt(nextOffsetSize / block.size);
  }
};

KbQueryData.prototype.inBlockBuffer = function(abuf, offset) {

  //계좌, 비밀번호 해쉬값
  /*if(this.getAccPwHash())
  {
    abuf.setOriString(offset, 44, this.getAccPwHash());
    offset += 44;
  }*/

  AQueryData.prototype.inBlockBuffer.call(this, abuf, offset);
};

KbQueryData.prototype.outBlockData = function(abuf, offset) {
  if(this.getQuery().getQueryType() == '.Func') {
    const bufOffset = abuf.getOffset();
    //연속 키
    const sztCont = abuf.getOriString(BP.OS_VTRAN_SZTCONT, BP.SZ_VTRAN_SZTCONT);
    if (sztCont == '2') {
      //'0':X, '1','3': 사용안함
      var szContKey = abuf.getOriString(BP.OS_VTRAN_SZCONTKEY, BP.SZ_VTRAN_SZCONTKEY);
      this.setContiKey(szContKey);
    }

    abuf.setOffset(bufOffset);
  }

  AQueryData.prototype.outBlockData.call(this, abuf, offset);
};

KbQueryData.prototype.inBlockOccurs = function(block) {
  return 1;
};

//OutblockData에서 각 필드에 대한 데이터를 버퍼에서 추출할 때 호출하는 함수
KbQueryData.prototype.extractFieldData = function(abuf, obj, blockData, fmt) {
  if (fmt[AQuery.ITYPE]==AQuery.STRING) {
    obj[fmt[AQuery.IKEY]] = abuf.nextString(fmt[AQuery.ISIZE]);
  } else {
    //asoocool dblTostr
    //double 형이지만 문자열로 리턴받기를 원할 경우
    if (this.dblTostr) {
      //3333.2222 , 3344232
      let tmp = abuf.nextString(fmt[AQuery.ISIZE]).split('.');

      tmp[0] = parseInt(tmp[0], 10);

      if (tmp.length>1) tmp = tmp[0] + '.' + tmp[1];
      else tmp = tmp[0].toString();

      obj[fmt[AQuery.IKEY]] = tmp;
    } else {
      //exp = fmt[AQuery.IEXP];

      obj[fmt[AQuery.IKEY]] = abuf.nextParseFloat(fmt[AQuery.ISIZE])||'0';
      //if(exp>0) obj[fmt[AQuery.IKEY]] = abuf.nextParseFloat(fmt[AQuery.ISIZE]).toFixed(exp);
      //else obj[fmt[AQuery.IKEY]] = abuf.nextParseFloat(fmt[AQuery.ISIZE]);
    }
  }

  //필드에서 데이터를 뽑아내고 나서
  //각 필드데이터 뒷부분에 속성값이 들어가있어 처리가 필요한 경우
  if (this.aquery.getValue('attr')) obj[fmt[AQuery.IKEY]+'_attr'] = abuf.nextByte();
};

//extractFieldData 함수에서 처리가능하므로 제거예정
KbQueryData.prototype.extractFieldAttr = function(abuf, obj, blockData, fmt) {
  //필드에서 데이터를 뽑아내고 나서
  //각 필드데이터 뒷부분에 속성값이 들어가있어 처리가 필요한 경우
  if (this.aquery.getValue('attr')) obj[fmt[AQuery.IKEY]+'_attr'] = abuf.nextByte();
};

KbQueryData.prototype.setFieldAttr = function(abuf, obj, blockData, fmt) {
  //데이터를 버퍼에 세팅하고 나서 각 필드데이터 뒷부분에 속성값 처리가 필요한 경우
  if (this.aquery.getValue('attr')) abuf.addByte(0x20);
};

module.exports = KbQueryData;