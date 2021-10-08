BEGIN_FUNCTION_MAP
			.Feed, KRX체결(MTS), KBRSKXSM,  2949, attr, keycnt=  4000, bufcnt=    20, group=    0;
	BEGIN_DATA_MAP
		KBRSKXSMIn, 입력,   1, input;
		begin
			실시간키        , RL_TM_KEY   , rl_tm_key   , char  ,    40, 92370;
		end
		KBRSKXSMOut, 출력,   2, output;
		begin
			실시간키        , RL_TM_KEY   , rl_tm_key   , char  ,    40, 92370;
			전일대비구분코드, BDY_CMPR_CCD, bdy_cmpr_ccd, char  ,     1,  2413;
			전일대비        , BDY_CMPR    , bdy_cmpr    , long  ,     8, 86064;
			등락율P2        , UP_DWN_R_P2 , up_dwn_r_p2 , double,   7.2, 89668;
			현재가          , NOW_PRC     , now_prc     , long  ,     8, 19579;
			시가            , OPN_PRC     , opn_prc     , long  ,     8, 53716;
			고가            , HGH_PRC     , hgh_prc     , long  ,     8, 53717;
			저가            , LW_PRC      , lw_prc      , long  ,     8, 53718;
			누적거래량      , ACML_VLM    , acml_vlm    , long  ,    12, 86321;
		end
	END_DATA_MAP
END_FUNCTION_MAP
			

