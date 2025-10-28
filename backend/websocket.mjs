import { Server } from "socket.io";
import Redis from "ioredis";
import Rooms from "./models/Rooms.model.js";
import queue from "./workers/queue.js";
import dotenv from "dotenv";

const addJob = queue.addJob;

dotenv.config();

export const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis clients for pub/sub
  const redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  // Server instance ID
  const SERVER_ID = `server-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

  // Configuration constants
  const UNDO_LIMIT = 25;
  const BATCH_TRIGGER_SIZE = 50;

  console.log(`🎨 Canvas WebSocket server ${SERVER_ID} initialized`);

  // Subscribe to Redis channels for cross-server communication
  redisSubscriber.subscribe("canvas-events", "room-events");

  redisSubscriber.on("message", async (channel, message) => {
    try {
      const data = JSON.parse(message);

      // Don't process events from this server
      // if (data.serverId === SERVER_ID) return;

      switch (channel) {
        case "canvas-events":
          await handleCanvasEvent(data);
          break;
        case "room-events":
          await handleRoomEvent(data);
          break;
      }
    } catch (error) {
      console.error("❌ Redis message parsing error:", error);
    }
  });

  const handleCanvasEvent = async (data) => {
    const { type, roomid, socketId } = data;

    switch (type) {
      case "DRAW_ACTION":
        // Forward drawing action to all clients in room except sender
        io.to(roomid).except(socketId).emit("DRAW_ACTION", data.strokeData);
        break;

      case "CANVAS_RESET":
        io.to(roomid).emit("CANVAS_RESET");
        break;

      case "CANVAS_HISTORY":
        io.to(roomid).emit("CANVAS_HISTORY", data.payload);
        break;

      case "CREATE_SNAPSHOT":
        // --- LOCK 2: Ensure only one server delegates the snapshot task ---
        const delegateLockKey = `lock:snapshot-delegate:${roomid}`;
        // Attempt to acquire the lock. Expire after 30s to prevent deadlocks.
        const lockAcquired = await redisClient.set(
          delegateLockKey,
          SERVER_ID,
          "EX",
          30,
          "NX"
        );

        if (lockAcquired) {
          console.log(
            `🔐 Delegate lock acquired by server ${SERVER_ID} for room ${roomid}`
          );
          const roomClients = io.sockets.adapter.rooms.get(roomid);
          if (roomClients && roomClients.size > 0) {
            const clientArray = Array.from(roomClients);
            const randomClientId =
              clientArray[Math.floor(Math.random() * clientArray.length)];
            console.log(
              `🎯 Delegating snapshot creation to client ${randomClientId} in room ${roomid}`
            );
            io.to(randomClientId).emit("CREATE_SNAPSHOT", data.payload);
          } else {
            // If no clients are on this server, release the lock immediately
            await redisClient.del(delegateLockKey);
          }
        }
        break;
    }
  };

  const handleRoomEvent = async (data) => {
    const { type, roomid } = data;

    switch (type) {
      case "USER_JOINED":
        io.to(roomid).emit("USER_JOINED", data.payload);
        break;
      case "USER_LEFT":
        io.to(roomid).emit("USER_LEFT", data.payload);
        break;
    }
  };

  io.on("connection", async (socket) => {
    console.log(`🔌 New client connected: ${socket.id} on server ${SERVER_ID}`);

    // Track connection count
    await redisClient.incr(`server:${SERVER_ID}:connections`);

    socket.on("JOIN_ROOM", async (roomid) => {
      try {
        // Add socket to Redis room tracking
        await redisClient.sadd(`room:${roomid}:members`, socket.id);
        await redisClient.hset(`socket:${socket.id}`, {
          roomid: roomid,
          serverId: SERVER_ID,
          joinedAt: Date.now(),
        });

        // Join Socket.IO room
        socket.join(roomid);

        // Get or create room session data from Redis
        let sessionData = await redisClient.hgetall(`session:${roomid}`);

        if (!sessionData.roomid) {
          // Initialize session in Redis
          sessionData = {
            roomid: roomid,
            undoStack: JSON.stringify([]),
            redoStack: JSON.stringify([]),
            currBaseImageURL: "",
            createdAt: Date.now(),
          };
          await redisClient.hset(`session:${roomid}`, sessionData);
        }

        // Check/create room in MongoDB
        let room = await Rooms.findOne({ roomid: roomid });
        if (!room) {
          // Get dimensions from Redis
          const roomData = await redisClient.hgetall(`room:${roomid}`);
          const width = parseInt(roomData.canvasWidth, 10) || 1280;
          const height = parseInt(roomData.canvasHeight, 10) || 720;

          room = new Rooms({
            roomid: roomid,
            canvasSnapshot: null,
            canvasWidth: width,
            canvasHeight: height,
          });
          await room.save();
          console.log(`📁 Room ${roomid} created in MongoDB by ${socket.id}`);
        }

        // Update current base image from MongoDB if available
        if (room.canvasSnapshot && !sessionData.currBaseImageURL) {
          await redisClient.hset(
            `session:${roomid}`,
            "currBaseImageURL",
            room.canvasSnapshot
          );
          sessionData.currBaseImageURL = room.canvasSnapshot;
        }

        // Send canvas history to joining client
        socket.emit("CANVAS_HISTORY", {
          baseImageURL: sessionData.currBaseImageURL || null,
          history: JSON.parse(sessionData.undoStack || "[]"),
          width: room.canvasWidth,
          height: room.canvasHeight,
        });

        // Update member count
        const memberCount = await redisClient.scard(`room:${roomid}:members`);
        await redisClient.hset(`room:${roomid}`, "memberCount", memberCount);

        // Publish room join event to other servers
        await redisClient.publish(
          "room-events",
          JSON.stringify({
            type: "USER_JOINED",
            roomid: roomid,
            socketId: socket.id,
            serverId: SERVER_ID,
            memberCount: memberCount,
            payload: { socketId: socket.id, memberCount },
          })
        );

        console.log(
          `👥 Client ${socket.id} joined room ${roomid} (${memberCount} members)`
        );
      } catch (error) {
        console.error("❌ Error joining room:", error);
        socket.emit("ERROR", "Failed to join room");
      }
    });

    socket.on("DRAW_ACTION", async (data) => {
      try {
        // Publish to Redis for other servers
        await redisClient.publish(
          "canvas-events",
          JSON.stringify({
            type: "DRAW_ACTION",
            roomid: data.roomid,
            socketId: socket.id,
            serverId: SERVER_ID,
            strokeData: data.strokeData,
            timestamp: Date.now(),
          })
        );

        // Broadcast to local clients
        socket.to(data.roomid).emit("DRAW_ACTION", data.strokeData);
      } catch (error) {
        console.error("❌ Error handling draw action:", error);
      }
    });

    socket.on("CANVAS_RESET", async (roomid) => {
      try {
        // Reset session in Redis
        await redisClient.hset(`session:${roomid}`, {
          undoStack: JSON.stringify([]),
          redoStack: JSON.stringify([]),
          currBaseImageURL: "",
        });

        // Add job to worker queue for MongoDB update
        await addJob("canvas-reset", {
          roomid: roomid,
          timestamp: Date.now(),
        });

        // Publish reset event to other servers
        await redisClient.publish(
          "canvas-events",
          JSON.stringify({
            type: "CANVAS_RESET",
            roomid: roomid,
            serverId: SERVER_ID,
            timestamp: Date.now(),
          })
        );

        // Broadcast to local clients
        io.to(roomid).emit("CANVAS_RESET");

        console.log(`🧹 Canvas reset for room ${roomid}`);
      } catch (error) {
        console.error("❌ Error resetting canvas:", error);
        io.to(roomid).emit("ERROR", "Failed to reset canvas");
      }
    });

    socket.on("DRAW_STROKE", async (data) => {
      try {
        const { roomid, strokeData } = data;
        const sessionKey = `session:${roomid}`;

        socket.to(roomid).emit("DRAW_STROKE", strokeData);

        const undoStackStr = await redisClient.hget(sessionKey, "undoStack");
        const undoStack = JSON.parse(undoStackStr || "[]");
        undoStack.push(strokeData);

        await redisClient.hset(sessionKey, {
          undoStack: JSON.stringify(undoStack),
          redoStack: JSON.stringify([]),
        });

        if (undoStack.length >= BATCH_TRIGGER_SIZE) {
          // --- LOCK 1: Ensure only one server can trigger a snapshot ---
          const triggerLockKey = `lock:snapshot-trigger:${roomid}`;
          // Attempt to acquire the lock. Expire after 30s to prevent deadlocks.
          const lockAcquired = await redisClient.set(
            triggerLockKey,
            SERVER_ID,
            "EX",
            30,
            "NX"
          );

          // ✅ AFTER
          if (lockAcquired) {
            console.log(
              `🔐 Trigger lock acquired by server ${SERVER_ID} for room ${roomid}`
            );

            // Use .slice() to copy, don't modify the stack yet
            const strokesToSave = undoStack.slice(
              0,
              BATCH_TRIGGER_SIZE - UNDO_LIMIT
            );

            // REMOVED the line that saved the trimmed stack back to Redis.

            const currBaseImageURL = await redisClient.hget(
              sessionKey,
              "currBaseImageURL"
            );

            // Add strokesToTrim to the payload
            await redisClient.publish(
              "canvas-events",
              JSON.stringify({
                type: "CREATE_SNAPSHOT",
                roomid: roomid,
                serverId: SERVER_ID,
                payload: {
                  baseImageURL: currBaseImageURL || null,
                  strokesToSave: strokesToSave,
                  strokesToTrim: strokesToSave.length,
                },
              })
            );
            console.log(`📸 Snapshot request published for room ${roomid}`);
          }
        }
      } catch (error) {
        console.error("❌ Error handling draw stroke:", error);
      }
    });

    // ✅ AFTER
    socket.on("SUBMIT_SNAPSHOT", async (data) => {
      try {
        const { roomid, newSnapshotURL, strokesToTrim } = data; // Get strokesToTrim
        const sessionKey = `session:${roomid}`;

        // Get the current undo stack
        const undoStackStr = await redisClient.hget(sessionKey, "undoStack");
        const undoStack = JSON.parse(undoStackStr || "[]");

        // Trim the stack now
        if (strokesToTrim > 0) {
          undoStack.splice(0, strokesToTrim);
        }

        // Atomically update the base image AND the trimmed stack
        await redisClient.hset(sessionKey, {
          currBaseImageURL: newSnapshotURL,
          undoStack: JSON.stringify(undoStack),
        });

        await addJob("update-snapshot", {
          roomid: roomid,
          snapshotURL: newSnapshotURL,
          timestamp: Date.now(),
        });

        // Release locks
        const triggerLockKey = `lock:snapshot-trigger:${roomid}`;
        const delegateLockKey = `lock:snapshot-delegate:${roomid}`;
        await redisClient.del(triggerLockKey, delegateLockKey);
        console.log(`🔓 Locks released for room ${roomid}`);

        console.log(
          `💾 Snapshot submitted and undoStack trimmed for room ${roomid}`
        );
      } catch (error) {
        console.error("❌ Error submitting snapshot:", error);
        io.to(data.roomid).emit("ERROR", "Failed to update canvas snapshot");
      }
    });

    socket.on("UNDO_ACTION", async (roomid) => {
      try {
        const sessionKey = `session:${roomid}`;
        const sessionData = await redisClient.hmget(
          sessionKey,
          "undoStack",
          "redoStack",
          "currBaseImageURL"
        );
        const undoStack = JSON.parse(sessionData[0] || "[]");
        const redoStack = JSON.parse(sessionData[1] || "[]");

        if (undoStack.length > 0) {
          const lastAction = undoStack.pop();
          redoStack.push(lastAction);

          // Update Redis
          await redisClient.hset(sessionKey, {
            undoStack: JSON.stringify(undoStack),
            redoStack: JSON.stringify(redoStack),
          });

        //   let room = await Rooms.findOne({ roomid: roomid });
        // if (!room) {
        //   // Get dimensions from Redis
        //   const roomData = await redisClient.hgetall(`room:${roomid}`);
        //   const width = parseInt(roomData.canvasWidth, 10) || 1280;
        //   const height = parseInt(roomData.canvasHeight, 10) || 720;

          const payload = {
            baseImageURL: sessionData[2] || null,
            history: undoStack,
            width:1280,
            height:720
          };

          // Publish to other servers
          await redisClient.publish(
            "canvas-events",
            JSON.stringify({
              type: "CANVAS_HISTORY",
              roomid: roomid,
              serverId: SERVER_ID,
              payload: payload,
            })
          );

          // Broadcast to local clients
          io.to(roomid).emit("CANVAS_HISTORY", payload);
        }
      } catch (error) {
        console.error("❌ Error handling undo:", error);
      }
    });

    socket.on("REDO_ACTION", async (roomid) => {
      try {
        const sessionKey = `session:${roomid}`;
        const sessionData = await redisClient.hmget(
          sessionKey,
          "undoStack",
          "redoStack",
          "currBaseImageURL"
        );
        const undoStack = JSON.parse(sessionData[0] || "[]");
        const redoStack = JSON.parse(sessionData[1] || "[]");

        if (redoStack.length > 0) {
          const lastAction = redoStack.pop();
          undoStack.push(lastAction);

          // Update Redis
          await redisClient.hset(sessionKey, {
            undoStack: JSON.stringify(undoStack),
            redoStack: JSON.stringify(redoStack),
          });

          const payload = {
            baseImageURL: sessionData[2] || null,
            history: undoStack,
          };

          // Publish to other servers
          await redisClient.publish(
            "canvas-events",
            JSON.stringify({
              type: "CANVAS_HISTORY",
              roomid: roomid,
              serverId: SERVER_ID,
              payload: payload,
            })
          );

          // Broadcast to local clients
          io.to(roomid).emit("CANVAS_HISTORY", payload);
        }
      } catch (error) {
        console.error("❌ Error handling redo:", error);
      }
    });

    socket.on("disconnect", async () => {
      try {
        // Get socket info
        const socketInfo = await redisClient.hgetall(`socket:${socket.id}`);
        const roomid = socketInfo.roomid;

        if (roomid) {
          // Remove from room members
          await redisClient.srem(`room:${roomid}:members`, socket.id);

          // Update member count
          const memberCount = await redisClient.scard(`room:${roomid}:members`);
          await redisClient.hset(`room:${roomid}`, "memberCount", memberCount);

          // Publish leave event
          await redisClient.publish(
            "room-events",
            JSON.stringify({
              type: "USER_LEFT",
              roomid: roomid,
              socketId: socket.id,
              serverId: SERVER_ID,
              memberCount: memberCount,
              payload: { socketId: socket.id, memberCount },
            })
          );
        }

        // Clean up socket data
        await redisClient.del(`socket:${socket.id}`);
        await redisClient.decr(`server:${SERVER_ID}:connections`);

        console.log(`🔌 Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error("❌ Error handling disconnect:", error);
      }
    });
  });

  // Clean up on server shutdown
  process.on("SIGTERM", async () => {
    await redisClient.quit();
    await redisSubscriber.quit();
  });
};

// export default { initializeSocketIO };
