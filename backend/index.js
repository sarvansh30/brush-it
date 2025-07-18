const express = require('express');
const http = require('http');
const {WebSocketServer} = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const wss = new WebSocketServer({server});

wss.on('connection',(ws)=>{
    console.log("new client connected");

    ws.on('message',(message)=>{
        wss.clients.forEach(client =>{
        if(client !==ws && client.readyState === WebSocket.OPEN){
            client.send(message);
        }
    });
    });

    ws.on('close',()=>{
        console.log("client disconnected");
    });
});

server.listen(PORT,()=>console.log(`Server listening on port: ${PORT}`));
