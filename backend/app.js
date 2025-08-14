const express = require('express');
const {v4  :uuidv4} = require('uuid');

const app = express();


app.get('/status',(req,res)=>{
    res.send("Server is up and runnning");
});

app.post('/create-room',(req,res)=>{
    const roomId = uuidv4();

    res.json({
        roomId: roomId,
        message: "Room created successfully"
    });
});

app.get('/room/:roomId',(req,res)=>{
    const roomId = req.params.roomId;
    
});

module.exports =app;
