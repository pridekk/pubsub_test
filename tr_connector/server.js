const KbQueryManager = require("./Library/KbQueryManager.js");
const KbWebsocketIO = require("./Library/KbWebsocketIO.js");
const net = require('net');
const qm = new KbQueryManager('main');
const socketFunc = new KbWebsocketIO(qm);
const redis = require("redis")
const axios = require("axios")
const TR_HOST = process.env.TR_SERVER || "dev-tr.myspec.io"
const TR_PORT = Number(process.env.TR_PORT || "5001")
const REDIS_HOST = process.env.REDIS_HOST || "192.168.0.2"
const REDIS_PORT = Number(process.env.REDIS_PORT || "6379")
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "spec12!@"
const STOCK_CODE_URL = process.env.STOCK_CODE_URL || "http://localhost/stocks/codes"
const SERVER_ID = process.env.SERVER_ID || 1
const REPLICAS = process.env.REPLICAS || 30


const publisher = redis.createClient({host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD})

/**
 * 거래소에 등록된 종목코드 가져오기
 * @param exchange_code: 거래소 코드
 * @returns {Promise<*>} 종목 코드 리스트
 */
const get_stock_codes = async (nodeId, replicas) => {

    const response = await axios.get(`${STOCK_CODE_URL}?id=${SERVER_ID}&replicas=${REPLICAS}`)

    let codes = [];
    if (response.status === 200) {
        codes = response.data.codes.map((code) => code.code)
    }
    // return ['009530', '000440', "000250"]
    // console.info("code")
    // console.info(codes)
    return codes
}


const app = async () => {
    let stock_codes = await get_stock_codes(SERVER_ID, REPLICAS)

    if(stock_codes.length > 0){

        let krx_stocks = stock_codes.filter(stock => stock.exchange_code === "KRX").map(stock => stock.code).slice(0,100)
        let overseas_stocks = stock_codes.filter(stock => stock.exchange_code === "KRX").map(stock => stock.exchange_code + stock.code).slice(0,100)
        let client = net.connect({ host: TR_HOST, port: TR_PORT }, () => {
            console.log('CONNECT!!');
            console.log(stock_codes.length)
            console.log(stock_codes.slice(0,10))
            qm.isShowProgress = true;
            qm.setQueryBuffer(1024*128, 1024*2048, 'euc-kr');
            qm.setNetworkIo(client);

            qm.registerReal('KBRSKXSM', 'rl_tm_key', krx_stocks, [], -1, queryData => {
                const blockData = queryData.getBlockData('OutBlock1');
                let real = parse_stock_real_data(blockData[0])
                console.log(real)
                publisher.publish("feed", JSON.stringify({code: real.code, data: real}) )
            });
            qm.registerReal('KBRSGSC0', 'rl_tm_key',overseas_stocks, [], -1, queryData => {
                const blockData = queryData.getBlockData('OutBlock1');
                let real = parse_overseas_feed(blockData[0])
                console.log(real)
                publisher.publish("feed", JSON.stringify({code: real.code, data: real}) )
                // publisher.publish("feed", JSON.stringify({code: real.code, data: real}) )
            });

        });

        client.on('error', function(error) {
            console.log(error);
        });

        client.on('data', function(data){
            socketFunc.onReceived(data);
        });
    } else {
        console.log("stock is empty!!");
        process.exit(1)
    }
}

/**
 * 국내종목 리얼 시세 데이터 파싱
 * @param data: KB증권 시세 포맷 데이터
 * @returns SPEC 포맷 종목 데이터 dict
 */
const parse_stock_real_data = (data) => {
    let stock_data = {}
    stock_data.exchange_code = "KRX"
    stock_data.code = data.rl_tm_key
    stock_data.current_price = data.now_prc
    stock_data.open_price = data.opn_prc
    stock_data.high_price = data.hgh_prc
    stock_data.low_price = data.lw_prc
    stock_data.amount = data.acml_vlm
    stock_data.fluctuation = data.bdy_cmpr
    stock_data.fluctuation_rate = data.up_dwn_r_p2
    return stock_data
}

/**
 * 해외종목 리얼 시세 데이터 파싱
 * @param data: KB증권 시세 해외 포맷 데이터
 * @returns SPEC 포맷 종목 데이터 dict
 */
const parse_overseas_feed = (data) => {
    let feed = {}
    feed.exchange_code = data.krx_cd
    feed.code = data.is_cd
    feed.current_price = data.now_prc_p4
    feed.open_price = data.opn_prc_p4
    feed.high_price = data.hgh_prc_p4
    feed.low_price = data.lw_prc_pf
    feed.amount = data.vlm
    feed.fluctuation = data.bdy_cmpr_p4
    feed.fluctuation_rate = data.up_dwn_r_p2
    feed.datetime = `${data.kor_dt.slice(0,4)}-${data.kor_dt.slice(4,6)}-${data.kor_dt.slice(6,8)} ${data.kor_tm.slice(0,2)}:${data.kor_tm.slice(2,4)}:${data.kor_tm.slice(4,6)}`

}

app().then(r => console.log("app started")).catch(err => {
    console.log(err)
    process.exit(1)
})
