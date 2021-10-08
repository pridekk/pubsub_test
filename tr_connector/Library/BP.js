//------------------------------------------------------------------------------------------------------------------
//	SIZE
//------------------------------------------------------------------------------------------------------------------

var BP = {}
	BP.SZ_MAX_PACKET = 12 * 1024;
	BP.SZ_MAX_SEND = 6 * 1024;
	
	//------------------------------
	//	공통 Header 영역
	//------------------------------
	BP.SZ_COMMON_HEADER	= 30;
	
	BP.SZ_LENGTH 			= 5;	//5 바이트 제외한 전체 길이
	BP.SZ_FUNCTION			= 1;	//I: Initiate Packet
									//T: Terminate Packet
									//S: Status Packet
									//*: Heart Bit Packet
									//U: Push Data  (통신 header + 데이터 packet)
									//L: 체결/ 미체결 처리용
									//C: FEP 시세 Packet
									//D: Data Packet
									//R: TCP 시세
									//B: Broadcast 시세
									//P: 공인 IP 전송
									//N: 세션키 
	
									//V: 신.접속용 Data Packet
									//O: 신.접속용 실시간 데이터 Packet
									//F  신.접속용 파일 Data Packet


	BP.SZ_DEST				= 6;	//?
	BP.SZ_SRC				= 6;	//
	BP.SZ_MD_GB			= 3;	//매체구분
	BP.SZ_EC_GB			= 1;	//암호/압축구분
									//0: 일반
									//1: 암호
									//2: 압축
									//3: 암호 + 압축

	BP.SZ_S_GB 			= 1;	//공인인증구분
									//0: 인증과 무관
									//1: 최초 인증
									//2: 전체 인증
									//3: 축약인증(HTS용) 
									//4: 축약인증(WEB용)
	BP.SZ_FILER 			= 7;
	
	//MAX PACKET SIZE = 12K
	//MAX SEND SIZE = 6K
	//Packet 길이가 송신버퍼 최대길이(12K Bytes)보다 크면 분할 전송
	//PACKET_HEADER의 FLAG에 마킹하며, 분할되지 않은 Single Packet 은 1 Packet Only('O') 로 마킹
	//FIRST_DATA + MID_DATA + MID_DATA + MID_DATA + .... + LAST_DATA
	
	//------------------------------------------------
	//	V : 신.접속용 Data Packet 
	//  SUB_FUNC
	//	A : 신 시세 실시간 요청 Packet B : 신 시세 실시간 해제 Packet : TR_CD(8) + (CODE(40) 코드뒤 공백*N)
	//	G : 신 PUSH 실시간 요청 Packet H : 신 PUSH 실시간 해제 Packet : (KEY(id, 계좌번호)*N)
	//------------------------------------------------
	
	BP.SZ_VCOMMON_HEADER			= 10;
	BP.SZ_VCOMMON_TOTAL_HEADER		= BP.SZ_COMMON_HEADER + BP.SZ_VCOMMON_HEADER;
	
	BP.SZ_VCOMMON_POSITION			= 1;	//'F', 'M', 'L', 'O'
	BP.SZ_VCOMMON_CON_SEQ			= 2;
	BP.SZ_VCOMMON_SUB_FUNC			= 1;	//E : 신 Tran Packet + 신 TR헤더

											// A : 신 시세 실시간 요청 Packet
											// B : 신 시세 실시간 해제 Packet       
											// G: 신 PUSH 실시간 요청 Packet
											// H: 신 PUSH 실시간 해제 Packet
											// 
											// O : 로그인 정보 설정
											// X: 암호회 키 설정
											// Y : 공인인증 키 설정
	BP.SZ_VCOMMON_RQ_ID			= 2;
	BP.SZ_VCOMMON_RESULT			= 1;
	BP.SZ_VCOMMON_FILLER			= 3;
	
	//------------------------------------------------
	//	V : 신.접속용 Data Packet
	//------------------------------------------------
	
	BP.SZ_VTRAN_HEADER				= 220;
	BP.SZ_VTRAN_SND_TOTAL_HEADER	= BP.SZ_COMMON_HEADER + BP.SZ_VCOMMON_HEADER + BP.SZ_VTRAN_HEADER;
	
	BP.SZ_VTRAN_HANDLE				= 8;
	BP.SZ_VTRAN_TR_CD				= 8;	//ex) KISn5001 - 주식현재가
	BP.SZ_VTRAN_SCR_NO				= 4;	//화면번호
	BP.SZ_VTRAN_MAP_NO				= 16;	//MAP번호
	BP.SZ_VTRAN_PRC_EMPNO			= 8;	//조작자 사번
	BP.SZ_VTRAN_MNG_EMPNO			= 8;	//책임자 사번
	BP.SZ_VTRAN_MSGCODE			= 4;	//메시지코드
	BP.SZ_VTRAN_OUT_TYPE			= 1;	//BLOCK MODE 'B'
	BP.SZ_VTRAN_FID_TYPE			= 1;	//FID Type
											//1		: FID
											//' '	: Struct
	BP.SZ_VTRAN_SZTCONT			= 1;	//연속구분
											//0: X
											//1: 이전O, 다음X - 사용안함
											//2: 이전X, 다음O
											//3: 이전O, 다음O - 사용안함
	BP.SZ_VTRAN_SZCONTKEY			= 120;	//연속키
	BP.SZ_VTRAN_GID				= 18;	//Global-ID
	BP.SZ_VTRAN_FILLER				= 12;	//
	BP.SZ_VTRAN_D_FLAG				= 1;	//목적지 구분값 'O': OMS
	BP.SZ_VTRAN_FILER				= 10;
	
	// 응답일때만 사용하는 MSG HEADER 
	BP.SZ_VTRAN_MSG_TOTAL_HEADER	= 87;
	BP.SZ_VTRAN_RCV_TOTAL_HEADER	= BP.SZ_VTRAN_SND_TOTAL_HEADER + BP.SZ_VTRAN_MSG_TOTAL_HEADER;
	
	BP.SZ_VTRAN_MSG_LENGTH			= 5;
	BP.SZ_VTRAN_MSG_GUGUN			= 2;
	BP.SZ_VTRAN_MSG_MSG			= 80;
	
	//------------------------------------------------
	//	로그인정보설정
	//------------------------------------------------
	
	BP.SZ_LOGIN_USER_ID			= 12;
	BP.SZ_LOGIN_PC_IP				= 15;
	BP.SZ_LOGIN_MEDIA				= 3;
	BP.SZ_LOGIN_MAC_ADDR			= 18;
	BP.SZ_LOGIN_BRNO				= 3;
	BP.SZ_LOGIN_CS_NO				= 16;
	
	
	//------------------------------------------------
	//	D Tran Data
	//------------------------------------------------
	
	BP.SZ_DTRAN_HEADER				= 106;
	BP.SZ_DTRAN_TOTAL_HEADER		= BP.SZ_COMMON_HEADER + BP.SZ_DTRAN_HEADER;
	
	BP.SZ_DTRAN_POSITION			= 1;
	BP.SZ_DTRAN_CON_SEQ			= 2;
	BP.SZ_DTRAN_TR_TYPE			= 1;
	BP.SZ_DTRAN_HANDLE				= 4;
	BP.SZ_DTRAN_TR_CD				= 8;
	BP.SZ_DTRAN_SCR_NO				= 4;
	BP.SZ_DTRAN_U_FLAG1			= 1;
	BP.SZ_DTRAN_U_FLAG2			= 1;
	BP.SZ_DTRAN_PROC_TIME			= 6;
	BP.SZ_DTRAN_BRNO				= 3;
	BP.SZ_DTRAN_PRC_EMPNO			= 8;
	BP.SZ_DTRAN_MNG_EMPNO			= 8;
	BP.SZ_DTRAN_MSGCODE			= 4;
	BP.SZ_DTRAN_GID				= 18;
	BP.SZ_DTRAN_TERM_NO			= 12;
	BP.SZ_DTRAN_RS1				= 4;
	BP.SZ_DTRAN_CMP_GB				= 1;
	BP.SZ_DTRAN_MAC_ADD			= 12;
	BP.SZ_DTRAN_TERM_ID			= 1;
	BP.SZ_DTRAN_PW_EN				= 1;
	BP.SZ_DTRAN_HTS_RQ_ID			= 1;
	BP.SZ_DTRAN_RS2				= 5;
	
	//------------------------------------------------
	//	Status Packet "S"
	//------------------------------------------------
	
	BP.SZ_STATUS_HEADER 			= 6;
	BP.SZ_STATUS_TOTAL_HEADER		= BP.SZ_COMMON_HEADER + BP.SZ_STATUS_HEADER; //가변 버퍼 제외
	
	BP.SZ_STATUS_TYPE				= 1;
	BP.SZ_STATUS_CODE				= 1;
	BP.SZ_STATUS_HANDLE			= 4;
// 	BP.SZ_STATUS_BUFFER			= 0;	//가변
	
	//------------------------------------------------
	//	암호화된 비밀번호 사이즈
	//------------------------------------------------
	BP.SZ_E2E_PWD					= 44;
	BP.SZ_REAL_KEY					= 40;  //신.접속용 시세, PUSH 등록,해제시 사용되는 키 사이즈
									
//------------------------------------------------------------------------------------------------------------------
//	OFFSET
//------------------------------------------------------------------------------------------------------------------
	
	BP.OS_LENGTH				= 0;
	BP.OS_FUNCTION				= BP.OS_LENGTH		+ BP.SZ_LENGTH;
	BP.OS_DEST					= BP.OS_FUNCTION	+ BP.SZ_FUNCTION;
	BP.OS_SRC					= BP.OS_DEST		+ BP.SZ_DEST;
	BP.OS_MD_GB				= BP.OS_SRC		+ BP.SZ_SRC;
	BP.OS_EC_GB				= BP.OS_MD_GB		+ BP.SZ_MD_GB;
	BP.OS_S_GB					= BP.OS_EC_GB		+ BP.SZ_EC_GB;
	BP.OS_FILER				= BP.OS_S_GB		+ BP.SZ_S_GB;
	
	//------------------------------
	//	V Common Header 영역
	//------------------------------
	
	BP.OS_VCOMMON_POSITION		= BP.OS_FILER		+ BP.SZ_FILER;
	
	
	BP.OS_VCOMMON_CON_SEQ		= BP.OS_VCOMMON_POSITION	+ BP.SZ_VCOMMON_POSITION;
	BP.OS_VCOMMON_SUB_FUNC		= BP.OS_VCOMMON_CON_SEQ	+ BP.SZ_VCOMMON_CON_SEQ;
	BP.OS_VCOMMON_RQ_ID		= BP.OS_VCOMMON_SUB_FUNC	+ BP.SZ_VCOMMON_SUB_FUNC;
	BP.OS_VCOMMON_RESULT		= BP.OS_VCOMMON_RQ_ID		+ BP.SZ_VCOMMON_RQ_ID;
	BP.OS_VCOMMON_FILLER		= BP.OS_VCOMMON_RESULT		+ BP.SZ_VCOMMON_RESULT;
	
	//------------------------------
	//	V Tran Header 영역
	//------------------------------
	
	BP.OS_VTRAN_HEADER			= BP.OS_VCOMMON_FILLER		+ BP.SZ_VTRAN_HANDLE;
	
	BP.OS_VTRAN_HANDLE			= BP.OS_VCOMMON_FILLER		+ BP.SZ_VCOMMON_FILLER;
	BP.OS_VTRAN_TR_CD			= BP.OS_VTRAN_HANDLE		+ BP.SZ_VTRAN_HANDLE;
	BP.OS_VTRAN_SCR_NO			= BP.OS_VTRAN_TR_CD		+ BP.SZ_VTRAN_TR_CD;
	BP.OS_VTRAN_MAP_NO			= BP.OS_VTRAN_SCR_NO		+ BP.SZ_VTRAN_SCR_NO;
	BP.OS_VTRAN_PRC_EMPNO		= BP.OS_VTRAN_MAP_NO		+ BP.SZ_VTRAN_MAP_NO;
	BP.OS_VTRAN_MNG_EMPNO		= BP.OS_VTRAN_PRC_EMPNO	+ BP.SZ_VTRAN_PRC_EMPNO;
	BP.OS_VTRAN_MSGCODE		= BP.OS_VTRAN_MNG_EMPNO	+ BP.SZ_VTRAN_MNG_EMPNO;
	BP.OS_VTRAN_OUT_TYPE		= BP.OS_VTRAN_MSGCODE		+ BP.SZ_VTRAN_MSGCODE;
	BP.OS_VTRAN_FID_TYPE		= BP.OS_VTRAN_OUT_TYPE		+ BP.SZ_VTRAN_OUT_TYPE;
	BP.OS_VTRAN_SZTCONT		= BP.OS_VTRAN_FID_TYPE		+ BP.SZ_VTRAN_FID_TYPE;
	BP.OS_VTRAN_SZCONTKEY		= BP.OS_VTRAN_SZTCONT		+ BP.SZ_VTRAN_SZTCONT;
	BP.OS_VTRAN_GID			= BP.OS_VTRAN_SZCONTKEY	+ BP.SZ_VTRAN_SZCONTKEY;
	BP.OS_VTRAN_FILLER			= BP.OS_VTRAN_GID			+ BP.SZ_VTRAN_GID;
	BP.OS_VTRAN_D_FLAG			= BP.OS_VTRAN_FILLER		+ BP.SZ_VTRAN_FILLER;
	BP.OS_VTRAN_FILER			= BP.OS_VTRAN_D_FLAG		+ BP.SZ_VTRAN_D_FLAG;
	
	//------------------------------
	//	V MSG Header 영역
	//------------------------------
	
	BP.OS_VTRAN_MSG_LENGTH		= BP.OS_VTRAN_FILER		+ BP.SZ_VTRAN_FILER;
	BP.OS_VTRAN_MSG_GUGUN		= BP.OS_VTRAN_MSG_LENGTH	+ BP.OS_VTRAN_MSG_LENGTH;
	BP.OS_VTRAN_MSG_MSG		= BP.OS_VTRAN_MSG_GUGUN	+ BP.OS_VTRAN_MSG_GUGUN;
	
	//------------------------------
	//	D Header 영역
	//------------------------------
	
	BP.OS_DTRAN_POSITION		= BP.OS_FILER				+ BP.SZ_FILER;
	BP.OS_DTRAN_CON_SEQ		= BP.OS_DTRAN_POSITION		+ BP.SZ_DTRAN_POSITION;
	BP.OS_DTRAN_TR_TYPE		= BP.OS_DTRAN_CON_SEQ		+ BP.SZ_DTRAN_CON_SEQ;
	BP.OS_DTRAN_HANDLE			= BP.OS_DTRAN_TR_TYPE		+ BP.SZ_DTRAN_TR_TYPE;
	BP.OS_DTRAN_TR_CD			= BP.OS_DTRAN_HANDLE		+ BP.SZ_DTRAN_HANDLE;
	BP.OS_DTRAN_SCR_NO			= BP.OS_DTRAN_TR_CD		+ BP.SZ_DTRAN_TR_CD;
	BP.OS_DTRAN_U_FLAG1		= BP.OS_DTRAN_SCR_NO		+ BP.SZ_DTRAN_SCR_NO;
	BP.OS_DTRAN_U_FLAG2		= BP.OS_DTRAN_U_FLAG1		+ BP.SZ_DTRAN_U_FLAG1;
	BP.OS_DTRAN_PROC_TIME		= BP.OS_DTRAN_U_FLAG2		+ BP.SZ_DTRAN_U_FLAG2;
	BP.OS_DTRAN_BRNO			= BP.OS_DTRAN_PROC_TIME	+ BP.SZ_DTRAN_PROC_TIME;
	BP.OS_DTRAN_PRC_EMPNO		= BP.OS_DTRAN_BRNO			+ BP.SZ_DTRAN_BRNO;
	BP.OS_DTRAN_MNG_EMPNO		= BP.OS_DTRAN_PRC_EMPNO	+ BP.SZ_DTRAN_PRC_EMPNO;
	BP.OS_DTRAN_MSGCODE		= BP.OS_DTRAN_MNG_EMPNO	+ BP.SZ_DTRAN_MNG_EMPNO;
	BP.OS_DTRAN_GID			= BP.OS_DTRAN_MSGCODE		+ BP.SZ_DTRAN_MSGCODE;
	BP.OS_DTRAN_TERM_NO		= BP.OS_DTRAN_GID			+ BP.SZ_DTRAN_GID;
	BP.OS_DTRAN_RS1			= BP.OS_DTRAN_TERM_NO		+ BP.SZ_DTRAN_TERM_NO;
	BP.OS_DTRAN_CMP_GB			= BP.OS_DTRAN_RS1			+ BP.SZ_DTRAN_RS1;
	BP.OS_DTRAN_MAC_ADD		= BP.OS_DTRAN_CMP_GB		+ BP.SZ_DTRAN_CMP_GB;
	BP.OS_DTRAN_TERM_ID		= BP.OS_DTRAN_MAC_ADD		+ BP.SZ_DTRAN_MAC_ADD;
	BP.OS_DTRAN_PW_EN			= BP.OS_DTRAN_TERM_ID		+ BP.SZ_DTRAN_TERM_ID;
	BP.OS_DTRAN_HTS_RQ_ID		= BP.OS_DTRAN_PW_EN		+ BP.SZ_DTRAN_PW_EN;
	BP.OS_DTRAN_RS2			= BP.OS_DTRAN_HTS_RQ_ID	+ BP.SZ_DTRAN_HTS_RQ_ID;
	
	//------------------------------------------------
	//	Status Packet "S"
	//------------------------------------------------
	
	BP.OS_STATUS_TYPE			= BP.OS_FILER				+ BP.SZ_FILER;
	BP.OS_STATUS_CODE			= BP.OS_STATUS_TYPE		+ BP.SZ_STATUS_TYPE;
	BP.OS_STATUS_HANDLE		= BP.OS_STATUS_CODE		+ BP.SZ_STATUS_CODE;
	BP.OS_STATUS_BUFFER		= BP.OS_STATUS_HANDLE		+ BP.SZ_STATUS_HANDLE;
module.exports = BP;