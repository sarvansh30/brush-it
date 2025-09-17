const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const Redis = require('ioredis');
require('dotenv').config(); 

const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
}));
app.use(express.json());

// Redis client for API operations
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Server instance ID for tracking
const SERVER_ID = `server-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;


app.get('/status', async (req, res) => {
  try {
    // Check Redis connection
    const redisStatus = await redisClient.ping();
    
    res.json({
      message: "Server is up and running",
      serverId: SERVER_ID,
      redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Server running but Redis unavailable",
      serverId: SERVER_ID,
      error: error.message
    });
  }
});

const createRoomLimiter = rateLimit({
    windowMs:5*60*1000,
    max:5,
    message:"Too many room creation requests try again after 5 minutes",
    standardHeaders:true,
    legacyHeaders:false
});

app.post('/room/create-room',createRoomLimiter, async (req, res) => {
  const roomid = uuidv4();
  
  const canvasWidth = parseInt(req.body.canvasWidth, 10) || 1280;
  const canvasHeight = parseInt(req.body.canvasHeight, 10) || 720;

  if (canvasWidth < 100 || canvasWidth > 4096 || canvasHeight < 100 || canvasHeight > 4096) {
    return res.status(400).json({ message: "Invalid canvas dimensions." });
  }

  try {
    // Initialize room in Redis
     await redisClient.hset(`room:${roomid}`, {
      id: roomid,
      createdAt: Date.now(),
      createdBy: SERVER_ID,
      canvasSnapshot: '',
      memberCount: 0,
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight
    });
    
    // Set room expiry (optional - 24 hours)
    await redisClient.expire(`room:${roomid}`, 24 * 60 * 60);
    
    console.log(`Room created with ID: ${roomid} on server ${SERVER_ID}`);
    
    res.json({
      roomid: roomid,
      message: "Room created successfully",
      serverId: SERVER_ID
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      message: "Failed to create room",
      error: error.message
    });
  }
});

// Get room info
app.get('/room/:roomid', async (req, res) => {
  try {
    const { roomid } = req.params;
    const roomData = await redisClient.hgetall(`room:${roomid}`);
    
    if (!roomData.id) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    // Get active members count
    const membersCount = await redisClient.scard(`room:${roomid}:members`);
    
    res.json({
      ...roomData,
      activeMembers: membersCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get room info",
      error: error.message
    });
  }
});

// Get server stats
app.get('/stats', async (req, res) => {
  try {
    const activeRooms = await redisClient.keys('room:*');
    const totalConnections = await redisClient.get(`server:${SERVER_ID}:connections`) || 0;
    
    res.json({
      serverId: SERVER_ID,
      activeRooms: activeRooms.length,
      totalConnections: parseInt(totalConnections),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get stats",
      error: error.message
    });
  }
});

module.exports = { app, redisClient, SERVER_ID };