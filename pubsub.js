const redis = require("redis")
const express = require("express");
const subscriber = redis.createClient()
const app = express()
const server = require('http').createServer(app);
const jwt = require('jsonwebtoken')
const io = require('socket.io')(server, { cors : {  origin: "*",
        methods: ["GET"]}})

server.listen(3006, () => {
    console.log('Server listening at port %d', 3006)
})

let password = Buffer.from('SpecRestApiSecretKey', "base64")


io.on("connection", (socket) => {
    console.log(socket.handshake.query)
    let token=socket.handshake.query.token

    console.log(`connection request from ${socket.client.conn.remoteAddress} with socket id ${socket.id}`)
    jwt.verify(token, password, (err, decoded) => {

        if(err){
            console.log(`connection error socket id: ${socket.id}`)
            console.log(err)
        } else {
            console.log(`${decoded.id} is connected with socket id: ${socket.id}` )
        }
    });

});

subscriber.on("message", (channel, message) => {
    let data = JSON.parse(message)
    io.emit(data.code, data.data)
    console.log(`Received channel: ${channel} data: ${message}`)
})

subscriber.subscribe("feed")

