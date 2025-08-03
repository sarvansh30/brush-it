const http = require('http');
const app = require('./app');

const {initializeSocketIO} = require('./websocket');

const PORT = process.env.PORT || 3000;

const server  = http.createServer(app);

initializeSocketIO(server);

server.listen(PORT,()=>{console.log(`Server listening on ${PORT}`)});