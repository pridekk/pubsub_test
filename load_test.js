const redis = require("redis")

const publisher = redis.createClient('redis://localhost')

for(i = 0; i < 10000;i++){
    publisher.publish("feed", JSON.stringify({code: "005930", data: {now_price: `${i}\n`}}))
}


