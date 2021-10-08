const io = require("socket.io-client");


let jwt = "eyJhbGciOiJIUzUxMiJ9.eyJ1aWQiOiIxNTAyMTM3MDY5Iiwic3ViIjoiNDc0MjgiLCJzZXNzaW9uX2lkIjoiODFmODVjNjYtNzY0MS00YmFiLWJkNTktNjQ4MjIzMzMxNWNlIiwiaWQiOjQ3NDI4LCJleHAiOjE2MzQwOTk5NTYsImpvaW5fcGxhdGZvcm0iOiJLQUtBTyIsImlhdCI6MTYzMzY2Nzk1NiwiZW1haWwiOiJwcmlkZWtrQGdtYWlsLmNvbSJ9.M79VtOv0TDLFVYpB7X9VWtoM_Pvw1hpVrBvmtBN4P0UtOrlv5wWTZHPnjz22fuFChgBZ93cU9gAyTT9mWaG8CQ"
const socket = io(`http://localhost:3006?token=${jwt}`);

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});
socket.on('005930', (data) => {
    console.log(data)
})
socket.on('000440', (data) => {
    console.log(data)
})

console.log("connecting")