require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { app, SERVER_ID } = require('./app');
const { initializeSocketIO } = require('./websocket.mjs');
// 1. Import `stopProcessing` along with `initializeWorkers`
const { initializeWorkers, stopProcessing } = require('./workers/index');

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

// --- 2. Centralized Graceful Shutdown Handling ---
const gracefulShutdown = () => {
  console.log('🔄 Received shutdown signal, shutting down gracefully...');
  server.close(async () => {
    console.log('✅ HTTP server closed');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    // Call the worker stop function to cleanly shut it down
    await stopProcessing(); 
    process.exit(0);
  });
};

// Listen for both shutdown signals and call the same function
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// ------------------------------------------------

server.listen(PORT, () => {
  console.log(`🚀 Server ${SERVER_ID} listening on port ${PORT}`);
});