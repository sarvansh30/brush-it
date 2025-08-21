const Rooms = require('../models/Rooms.model');
const { registerWorker } = require('./queue');

// Worker for updating canvas snapshots in MongoDB
registerWorker('update-snapshot', async (data) => {
  const { roomid, snapshotURL } = data;
  
  try {
    await Rooms.updateOne(
      { roomid: roomid },
      { 
        $set: { 
          canvasSnapshot: snapshotURL,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    console.log(`💾 Canvas snapshot updated in MongoDB for room: ${roomid}`);
  } catch (error) {
    console.error(`❌ Failed to update snapshot for room ${roomid}:`, error);
    throw error; // Re-throw to trigger retry
  }
});

// Worker for canvas reset operations
registerWorker('canvas-reset', async (data) => {
  const { roomid } = data;
  
  try {
    await Rooms.updateOne(
      { roomid: roomid },
      { 
        $set: { 
          canvasSnapshot: null,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`🧹 Canvas reset in MongoDB for room: ${roomid}`);
  } catch (error) {
    console.error(`❌ Failed to reset canvas for room ${roomid}:`, error);
    throw error;
  }
});

// Worker for cleaning up old room data
registerWorker('cleanup-old-rooms', async (data) => {
  const { olderThanDays = 7 } = data;
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await Rooms.deleteMany({
      updatedAt: { $lt: cutoffDate }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old rooms`);
  } catch (error) {
    console.error('❌ Failed to cleanup old rooms:', error);
    throw error;
  }
});

// Worker for generating room analytics
registerWorker('room-analytics', async (data) => {
  const { roomid } = data;
  
  try {
    const room = await Rooms.findOne({ roomid });
    if (!room) return;
    
    // Calculate some analytics
    const stats = {
      roomId: roomid,
      hasSnapshot: !!room.canvasSnapshot,
      lastActivity: room.updatedAt,
      createdAt: room.createdAt,
      // Add more analytics as needed
    };
    
    console.log(`📊 Analytics generated for room ${roomid}:`, stats);
  } catch (error) {
    console.error(`❌ Failed to generate analytics for room ${roomid}:`, error);
    throw error;
  }
});

module.exports = {
  // Export worker types for external use
  WORKER_TYPES: {
    UPDATE_SNAPSHOT: 'update-snapshot',
    CANVAS_RESET: 'canvas-reset',
    CLEANUP_OLD_ROOMS: 'cleanup-old-rooms',
    ROOM_ANALYTICS: 'room-analytics'
  }
};