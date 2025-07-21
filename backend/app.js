const express = require('express');
const app = express();


app.get('/status',(req,res)=>{
    res.send("Server is up and runnning");
});


module.exports =app;
