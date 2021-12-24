var axios = require('axios');
var data = JSON.stringify([
    {
        "thm_cd": "0009"
    }
]);

var config = {
    method: 'post',
    url: 'http://localhost:8080/api/v1/affiliated/theme-by-codes',
    headers: {
        'apiKey': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiZDhhYzk5NThmY2QzNGFjODk5YmNjYTJjYjNiMTNkYjEiLCJleHBpcmVkX2F0IjoxNjM0MTY5MDY3fQ.ROWA7cNZU5uoeNRhBIwCRk6_iyVeKL7Z5ghGzCXt2xU',
        'Content-Type': 'application/json',
        'Cookie': 'SESSION=MzZhMmVhYjEtNGVjMi00YjhiLTlmZjgtMGNkNzhiZTk5NmU1'
    },
    data : data
};

axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });