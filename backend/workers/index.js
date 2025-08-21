const { startProcessing, addJob } = require('./queue');
require('./canvasWorkers'); // Register all canvas-related workers

const initializeWorkers = () => {
  console.log('🏗️  Initializing background workers...');
  
  // Start the job processing
  startProcessing();
  
  // Schedule periodic cleanup jobs
  setInterval(async () => {
    await addJob('cleanup-old-rooms', { olderThanDays: 7 });
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  console.log('✅ Background workers initialized');
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  const { stopProcessing } = require('./queue');
  await stopProcessing();
});

process.on('SIGINT', async () => {
  const { stopProcessing } = require('./queue');
  await stopProcessing();
});

module.exports = {
  initializeWorkers,
  addJob
};