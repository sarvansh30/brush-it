const express = require('express');
const {v4  :uuidv4} = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/status',(req,res)=>{
    res.send("Server is up and runnning");
});

app.post('/room/create-room',(req,res)=>{
    const roomid = uuidv4();
    console.log("Room created with ID:", roomid);
    res.json({
        roomid: roomid,
        message: "Room created successfully"
    });
});

app.get('/room/:roomId',(req,res)=>{
    const roomId = req.params.roomId;

});

module.exports =app;
