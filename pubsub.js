const debug = require('debug')('log.debug')
const info = require('debug')('log.info')
const error = require('debug')('log.err')
const redis = require("redis")
const express = require("express")
const subscriber = redis.createClient()
const app = express()

const server = require('http').createServer(app)
const jwt = require('jsonwebtoken')

const io = require('socket.io')(server, { cors : {  origin: "*",
        methods: ["GET"]}})

server.listen(3006, () => {
    info('Server listening at port %d', 3006)
})

let password = Buffer.from('SpecRestApiSecretKey', "base64")


io.on("connection", (socket) => {
    socket.on("005930", (data) => {
        debug((data))
    })
    socket.onAny((data)=> {
        console.log(data)
    })

    debug(socket.handshake.query)
    let token=socket.handshake.query.token

    info(`connection request from ${socket.client.conn.remoteAddress} with socket id ${socket.id}`)
    jwt.verify(token, password, { algorithms: ['HS512'] }, (err, decoded) => {

        if(err){
            error(`connection error socket id: ${socket.id}`)
            error(err)
        } else {
            info(`${decoded.id} is connected with socket id: ${socket.id}` )
        }
    })

})

io.on("005930", (data) => debug(data))

subscriber.on("message", (channel, message) => {
    let data = JSON.parse(message)
    io.emit(data.code, data.data)
    debug(`Received channel: ${channel} data: ${message}`)
})

subscriber.subscribe("feed")

