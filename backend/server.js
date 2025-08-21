require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { app, SERVER_ID } = require('./app');
// import { initializeSocketIO } from './websocket.mjs';
const {initializeSocketIO} = require('./websocket.mjs');
const { initializeWorkers } = require('./workers/index');

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;

// Connect to MongoDB
mongoose.connect(MONGO_URL)
  .then(() => console.log(`✅ Connected to MongoDB on server ${SERVER_ID}`))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with Redis support
initializeSocketIO(server);

// Initialize background workers
initializeWorkers();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server ${SERVER_ID} listening on port ${PORT}`);
});
