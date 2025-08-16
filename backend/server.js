require('dotenv').config();
const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const {initializeSocketIO} = require('./websocket');

const PORT = process.env.PORT || 3000;

const MONGO_URL = process.env.MONGO_URL;
mongoose.connect(MONGO_URL)
    .then(()=>console.log("Connected to brush-it Cluster0 MongoDB  successfully"))
    .catch((err)=>console.error("Error connecting to MongoDB:", err));

const server  = http.createServer(app);

initializeSocketIO(server);

server.listen(PORT,()=>{console.log(`Server listening on ${PORT}`)});