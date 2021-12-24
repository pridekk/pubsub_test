const io = require("socket.io-client");
const arrayShuffle = require('shuffle-array');


let JWT = process.env.JWT || "eyJhbGciOiJIUzUxMiJ9.eyJ1aWQiOiIxMzI4Nzg3MSIsInN1YiI6IjY0MDciLCJzZXNzaW9uX2lkIjoiNDUzODVkNmItNjMzZC00YThhLTk3NmYtYzIxMzA0MTg4NmQ4IiwiaWQiOjY0MDcsImV4cCI6MTY0MDY2MDM4OSwiam9pbl9wbGF0Zm9ybSI6Ik5BVkVSIiwiaWF0IjoxNjQwMjI4Mzg5LCJlbWFpbCI6InByaWRla2tAZ21haWwuY29tIn0.btUCksj5jk4sWP5jgmiNKI9Zp_ayCVvKjqoTWYAbFN00QFL5l_cKffRNvYSjzNhBmi0Y1wb5JuFS90V_NAGzuw"
// const SERVER = process.env.SERVER || "https://dev-feed.myspec.io"
const SERVER = process.env.SERVER || "http://localhost:3004"


let url = `${SERVER}?token=${JWT}`
console.log(`Connecting to ${url}`)
const socket = io(url);

const codes = [
    {
        "exchange_code": "KRX",
        "code": "005930"
    },
    {
        "exchange_code": "KRX",
        "code": "010660"
    },
    {
        "exchange_code": "KRX",
        "code": "010470"
    },
    {
        "exchange_code": "KRX",
        "code": "009240"
    },
    {
        "exchange_code": "KRX",
        "code": "009300"
    },
    {
        "exchange_code": "KRX",
        "code": "009520"
    },
]

arrayShuffle(codes)

let selected_codes = codes.slice(0,getRandomInt(10,100))

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}

socket.on("connect", () => {
    console.log(socket.id);

    console.log(`join: ${selected_codes.map(stock => stock.exchange_code + ":" + stock.code)}`)

    socket.emit("JOIN", {id: socket.id, codes:selected_codes})

});

selected_codes.forEach(item => {
    socket.on(item.exchange_code + ":" + item.code, (data) => {
        console.log('data',data)
    })
})

socket.onAny((data)=> {
    console.log(data)
})
console.log("connecting")

