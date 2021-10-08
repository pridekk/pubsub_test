const KbQueryManager = require("./Library/KbQueryManager.js");
const KbWebsocketIO = require("./Library/KbWebsocketIO.js");
const net = require('net');
const qm = new KbQueryManager('main');
const socketFunc = new KbWebsocketIO(qm);
const redis = require("redis")
const axios = require("axios")
const tr_host = process.env.tr_server || "mable.kbsec.com"
const tr_port = process.env.tr_port || "5001"
const redis_host = process.env.redis_host || "localhost"
const redis_port = process.env.redis_port || "6379"
const spec_api_url = process.env.spec_api_url || "https://test.myspec.io"
const spec_api_key = process.env.spec_api_key || "SPecAPIKey1212"

const publisher = redis.createClient(`redis://${redis_host}:${redis_port}`)

const get_stock_codes = async () => {
    let headers = {'apikey': spec_api_key}
    const response = await axios.get(`${spec_api_url}/api/v2.1/stock/codes-and-names`, {headers: headers})
    let codes;
    if( response.status === 200 ){
        codes = response.data.filter((stock_code) => (stock_code.country_code === "KR")).map((code) => code.code)
    }
    return codes
}


const app = async () => {
    let stock_codes = await get_stock_codes()

    console.log(stock_codes/100)
    let clients = []

    for(let i = 0; i<stock_codes.length/100 ;i++){
        let client = net.connect({ host: tr_host, port: tr_port }, () => {
            console.log('CONNECT!!');

            qm.isShowProgress = true;
            qm.setQueryBuffer(1024*128, 1024*2048, 'euc-kr');
            qm.setNetworkIo(client);

            let stocks = stock_codes.slice(i,(i+1)*100)
            qm.registerReal('KBRSKXSM', 'rl_tm_key', stocks, [], -1, queryData => {
                const blockData = queryData.getBlockData('OutBlock1');
                let real = parse_stock_real_data(blockData[0])
                publisher.publish("feed", JSON.stringify({code: real.code, data: real}) )
            });
        });

        client.on('error', function(error) {
            console.log(error);
        });

        client.on('data', function(data){
            publisher.publish("feed", JSON.stringify({code: "005930", data: data.toString()}) )
            socketFunc.onReceived(data);
        });
        clients.push(client)
    }

    console.log(clients.length)

}

const parse_stock_real_data = (data) => {

    let stock_data = {}
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

 app().then(r => console.log("app started"))
