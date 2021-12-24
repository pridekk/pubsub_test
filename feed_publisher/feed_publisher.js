const redis = require("redis")
const express = require("express")

const SERVER_PORT = Number(process.env.SERVER_PORT || 3004)
const JWT_KEY = process.env.JWT_KEY || 'SpecRestApiSecretKey20211122'
const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'spec12!@'
const subscriber = redis.createClient({host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD})
const app = express()
const server = require('http').createServer(app)
const jwt = require('jsonwebtoken')
const password = Buffer.from(JWT_KEY, "base64")

const io = require('socket.io')(server, { cors : {  origin: "*",
        methods: ["GET"]}})

console.log('test')
server.listen(SERVER_PORT, () => {
    console.log(`Server listening at port ${SERVER_PORT}`)
})


io.sockets.on("connect", (socket) => {

    console.log(socket.handshake.query)
    let token=socket.handshake.query.token

    console.log(`connection request from ${socket.client.conn.remoteAddress} with socket id ${socket.id}`)
    jwt.verify(token, password, { algorithms: ['HS512'] }, (err, decoded) => {
        if(err){
            console.log(`connection error socket id: ${socket.id}`)
            console.log(err)
            socket.disconnect()
        } else {
            console.log(`${decoded.id} is connected with ip: ${socket.client.conn.remoteAddress}, socket id: ${socket.id}` )
        }
    })

    socket.on("JOIN", (data) => {
        let codes = data.codes
        if(codes && codes.length > 0){
            codes.forEach(item => {
                console.log(`join: ${item}`)
                socket.join(`${item.exchange_code}:${item.code}`)
            })
        }
    })
    socket.on("LEAVE", (code) => {
        socket.leave(code)
    })

    socket.on('disconnect', () => {
        console.log(`socket ${socket.id} is disconnected`)
    })

})
io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});

io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has left room ${room}`);
});

subscriber.on("message", (channel, message) => {
    try{
        let data = JSON.parse(message)
        if(data.code === "011210"){
            console.log(`Received channel: ${channel} data: ${message}`)
            console.log(`emit ${data.code}`)
        }
        io.to(data.data.exchange_code + ":" + data.code).emit(data.data)
    } catch (exception){
        console.log("Error occurred")
        console.log(exception)
    }

})

subscriber.subscribe("feed")
