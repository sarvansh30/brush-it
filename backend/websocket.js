
const {WebSocketServer,WebSocket} = require('ws');


const intializeWebsocket = (server)=>{

const wss = new WebSocketServer({server});

wss.on('connection',(ws)=>{
    console.log("New client connected");
    

    ws.on('message',(message)=>{

        wss.clients.forEach(client=>{
            if(client!=ws && client.readyState===WebSocket.OPEN){
                client.send(message);
            }
        });
    });

    ws.on('close',()=>{
        console.log("client disconnected");
    });
});

};

module.exports = {intializeWebsocket};