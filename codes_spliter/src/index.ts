import axios from "axios";
import * as express from 'express'
const MASTER_API = process.env.MASTER_API || "https://dev-api.myspec.io/v2/investments/stocks/master?detail=true"
const MASTER_API_KEY = process.env.MASTER_API_KEY || "HCdRdFEVus3FY0jUBqvEU7bQEdrBgTjy74Sfx8Qb"
const port = process.env.PORT || 80
const app = express()

app.get("/stocks/codes", (req, res) => {

  let clients = Number(req.query.replicas)
  let clientId = Number(req.query.id)
  console.log(`clientId: ${clientId}, number of clients: ${clients}`)

  let codesLength = Math.ceil(codes.length / clients)

  let startIndex = (clientId-1)*codesLength

  let endIndex = clientId*codesLength

  console.log(`startIndex: ${startIndex}, endIndex: ${endIndex}`)
  res.json({
    codes: codes.slice(startIndex, endIndex)
  })
})

let codes: [StockCode] = null;

// @ts-ignore
const getCodes = async () => {
  let response = await axios.get(MASTER_API, {headers: {'x-api-key': MASTER_API_KEY}})

  if(response.status === 200){

    codes = response.data.rows;

    codes.sort(() => Math.random() - 0.5);

    console.log(codes.length)
  }
}

getCodes().then(() => {
  console.log('codes loading is done')
  app.listen(port, () => {
    console.log("Stock code service is running")
  })
})
.catch((err) => {
  console.log(err.toString())
})


class StockCode {
  exchange_code: string
  country_code: string
  code: string
  name: string
}