const { startProcessing, addJob, stopProcessing } = require('./queue');
require('./canvasWorkers'); // Register all canvas-related workers

const initializeWorkers = () => {
  console.log('🏗️  Initializing background workers...');
  
  // Start the job processing in the background.
  // This self-invoking async function ensures the `while` loop
  // inside startProcessing runs continuously.
  (async () => {
    await startProcessing();
  })();
  
  // Schedule periodic cleanup jobs
  setInterval(async () => {
    await addJob('cleanup-old-rooms', { olderThanDays: 7 });
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  console.log('✅ Background workers initialized');
};

// Graceful shutdown listeners have been removed from this file.
// They should be handled in your main server.js entry point.

module.exports = {
  initializeWorkers,
  addJob,
  stopProcessing // Export the stop function to be used by server.js
};