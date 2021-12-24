BEGIN_FUNCTION_MAP
			.Feed, 해외주식실시간체결, KBRSGSC0,  2757, attr, keycnt=     0, bufcnt=    30, group=    0;
	BEGIN_DATA_MAP
		KBRSGSC0In, 입력,   1, input;
		begin
			실시간키        , RL_TM_KEY      , rl_tm_key      , char  ,    40, 92370;
		end
		KBRSGSC0Out, 출력,   2, output;
		begin
			실시간키        , RL_TM_KEY      , rl_tm_key      , char  ,    40, 92370;
			데이터구분      , DATA_CLSF      , data_clsf      , char  ,     1, 40094;
			거래소코드      , KRX_CD         , krx_cd         , char  ,     3, 53523;
			종목코드        , IS_CD          , is_cd          , char  ,    16, 60512;
			영업일자        , BSNSS_DT       , bsnss_dt       , long  ,     8, 45427;
			일자            , DT             , dt             , long  ,     8,  9306;
			시간            , TM             , tm             , char  ,     6, 31988;
			한국일자        , KOR_DT         , kor_dt         , char  ,     8, 93924;
			한국시간        , KOR_TM         , kor_tm         , char  ,     6, 100307;
			기준가P4        , SPRC_P4        , sprc_p4        , double,   9.4, 100072;
			현재가P4        , NOW_PRC_P4     , now_prc_p4     , char,   9.4, 100138;
			전일대비구분코드, BDY_CMPR_CCD   , bdy_cmpr_ccd   , char  ,     1,  2413;
			전일대비P4      , BDY_CMPR_P4    , bdy_cmpr_p4    , double,   9.4, 100139;
			등락율P2        , UP_DWN_R_P2    , up_dwn_r_p2    , double,   9.2, 86696;
			시가P4          , OPN_PRC_P4     , opn_prc_p4     , char,   9.4, 99943;
			고가P4          , HGH_PRC_P4     , hgh_prc_p4     , char,   9.4, 100064;
			저가P4          , LW_PRC_P4      , lw_prc_p4      , char,   9.4, 100065;
			체결수량        , CCLS_Q         , ccls_q         , long  ,     8,  4740;
			거래량          , VLM            , vlm            , long  ,    12, 86289;
			거래대금        , DL_TW_AMT      , dl_tw_amt      , long  ,    15, 86282;
			거래정지구분코드, DL_SPSN_CCD    , dl_spsn_ccd    , char  ,     1,  8583;
			매수호가P4      , B_ASKPRC_P4    , b_askprc_p4    , double,   9.4, 100042;
			매도호가P4      , S_ASKPRC_P4    , s_askprc_p4    , double,   9.4, 100041;
			매수잔량        , B_RV           , b_rv           , long  ,     8, 87052;
			매도잔량        , S_RV           , s_rv           , long  ,     8, 86796;
			가중평균가P4    , WT_AVR_PRC_P4  , wt_avr_prc_p4  , double,   9.4, 100060;
			현재가원화P2    , NOW_PRC_KRW_P2 , now_prc_krw_p2 , double,  12.2, 100166;
			기준가원화P2    , SPRC_KRW_P2    , sprc_krw_p2    , double,  12.2, 100167;
			시가원화P2      , OPN_PRC_KRW_P2 , opn_prc_krw_p2 , double,  12.2, 100168;
			고가원화P2      , HGH_PRC_KRW_P2 , hgh_prc_krw_p2 , double,  12.2, 100169;
			저가원화P2      , LW_PRC_KRW_P2  , lw_prc_krw_p2  , double,  12.2, 100170;
			전일대비원화P2  , BDY_CMPR_KRW_P2, bdy_cmpr_krw_p2, double,  12.2, 100173;
			체결구분        , CCLS_CLSF      , ccls_clsf      , char  ,     1,  4655;
		end
	END_DATA_MAP
END_FUNCTION_MAP
			

