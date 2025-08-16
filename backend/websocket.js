const { Server } = require("socket.io");
const Rooms = require("./models/Rooms.model");
const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    }
  });

  const activeSessions = new Map();
  const UNDO_LIMIT = 25;
  const BATCH_TRIGGER_SIZE = 50;

  io.on("connection", (socket) => {
    console.log("New client connected with socket.io:", socket.id);

    socket.on("JOIN_ROOM", async (roomid) => {
      let room = await Rooms.findOne({ roomid: roomid });

      if (!room) {
        room = new Rooms({ roomid: roomid, canvasSnapshot: null });
        await room.save();
        console.log(`Room ${roomid} created by client ${socket.id}`);

        activeSessions.set(roomid, {
          undoStack: [],
          redoStack: [],
          currBaseImageURL:null,
        });
      }
      else if(!activeSessions.has(roomid)) {
        activeSessions.set(roomid, {
          undoStack:  [],
          redoStack:  [],
          currBaseImageURL: room.canvasSnapshot || null,
        });
        console.log(`Client ${socket.id} joined existing room ${roomid}`);
      }
      socket.join(roomid);

      socket.emit("CANVAS_HISTORY", {
        baseImageURL: activeSessions.get(roomid).currBaseImageURL,
        history: activeSessions.get(roomid).undoStack,
      });

      console.log(`Client ${socket.id} joined room ${roomid}`);
    });

    // socket.emit('CANVAS_HISTORY', pathHistory);

    socket.on("DRAW_ACTION", (data) => {
      // pathHistory.push(data);
      socket.to(data.roomid).emit("DRAW_ACTION", data.strokeData);
    });

    socket.on("CANVAS_RESET", async (roomid) => {
      try {
        await Rooms.updateOne(
          { roomid: roomid },
          { $set: { canvasSnapshot: null } }
        );

        io.to(roomid).emit("CANVAS_RESET");
      } catch (err) {
        console.error("Error resetting canvas:", err);
        io.to(roomid).emit("ERROR", "Failed to reset canvas");
      } finally {
        if (activeSessions.has(roomid)) {
          activeSessions.get(roomid).undoStack = [];
          activeSessions.get(roomid).redoStack = [];
        }
        console.log(`Canvas reset for room ${roomid}`);
      }
    });

    socket.on("DRAW_STROKE", async (data) => {
      const { roomid, strokeData } = data;
      const session = activeSessions.get(roomid);

      
      session.undoStack.push(strokeData);

      if (session.redoStack.length > 0) session.redoStack=[];

      if (session.undoStack.length >= BATCH_TRIGGER_SIZE) {
        const strokesToSave = session.undoStack.splice(0,BATCH_TRIGGER_SIZE - UNDO_LIMIT);

        const clientInRoom = io.sockets.adapter.rooms.get(roomid); 
        const clientArray = Array.from(clientInRoom);

        const randomClientId = clientArray[Math.floor(Math.random() * clientArray.length)];

        io.to(randomClientId).emit("CREATE_SNAPSHOT",{
          baseImageURL:session.currBaseImageURL,
          strokesToSave: strokesToSave,
        });

        console.log('Snapshot requrest sent to client:', randomClientId);

      }
    });

    socket.on("SUBMIT_SNAPSHOT",async (data)=>{
      const {roomid, newSnapshotURL} = data;

      const session = activeSessions.get(roomid);
      session.currBaseImageURL = newSnapshotURL;

      try{
      await Rooms.updateOne(
        { roomid: roomid },
        { $set: { canvasSnapshot: newSnapshotURL } });
      }
      catch(err){
        console.error("Error updating canvas snapshot:", err);
        io.to(roomid).emit("ERROR", "Failed to update canvas snapshot");
      }
        
    })

    socket.on("UNDO_ACTION", (roomid) => {
      if (activeSessions.get(roomid).undoStack.length > 0) {

        const lastAction = activeSessions.get(roomid).undoStack.pop();
        activeSessions.get(roomid).redoStack.push(lastAction);

        io.to(roomid).emit("CANVAS_HISTORY",{
        baseImageURL: activeSessions.get(roomid).currBaseImageURL,
        history: activeSessions.get(roomid).undoStack
        }
        );
      }
    });

    socket.on("REDO_ACTION", (roomid) => {
      if (activeSessions.get(roomid).redoStack.length > 0) {

        const lastAction = activeSessions.get(roomid).redoStack.pop();
        activeSessions.get(roomid).undoStack.push(lastAction);

        io.to(roomid).emit("CANVAS_HISTORY",{
        baseImageURL: activeSessions.get(roomid).currBaseImageURL,
        history: activeSessions.get(roomid).undoStack
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = { initializeSocketIO };
