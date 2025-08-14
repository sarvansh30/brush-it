const { Server } = require('socket.io');

const initializeSocketIO = (server) => {
  const io = new Server(server, {

    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // const pathHistory = [];
  // const redoStack = [];

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('New client connected with socket.io:', socket.id);

    socket.on('JOIN_ROOM',(roomid)=>{
      if(rooms.has(roomid)){
        socket.join(roomid);
        socket.emit('CANVAS_HISTORY', rooms.get(roomid).pathHistory);
        console.log(`Client ${socket.id} joined room ${roomid}`);
      }
      else{
        rooms.set(roomid,{pathHistory:[],redoStack:[]});
        socket.emit('CANVAS_HISTORY', rooms.get(roomid).pathHistory);
        console.log(`Room ${roomid} created and client ${socket.id} joined`);
        socket.join(roomid);
      }
    });

    // socket.emit('CANVAS_HISTORY', pathHistory);

    socket.on('DRAW_ACTION', (data) => {
      // pathHistory.push(data);
      socket.to(data.roomid).emit('DRAW_ACTION', data.strokeData);
    });

    socket.on('CANVAS_RESET',(roomid)=>{
      rooms.get(roomid).pathHistory.length = 0; 
      io.to(roomid).emit('CANVAS_RESET'); 
    })

    socket.on('DRAW_PATH',(data)=>{
      rooms.get(data.roomid).pathHistory.push(data.strokeData);
      // console.log('Received DRAW_PATH:', pathHistory);
    })

    socket.on('UNDO_ACTION',(roomid)=>{
      if (rooms.get(roomid).pathHistory.length>0){
        const lastAction = rooms.get(roomid).pathHistory.pop();
        rooms.get(roomid).redoStack.push(lastAction);
        io.to(roomid).emit('CANVAS_HISTORY', rooms.get(roomid).pathHistory);
      }
    });
    
    socket.on('REDO_ACTION',(roomid)=>{
      if (rooms.get(roomid).redoStack.length > 0) {
        const lastAction = rooms.get(roomid).redoStack.pop();
        rooms.get(roomid).pathHistory.push(lastAction);
        io.to(roomid).emit('CANVAS_HISTORY', rooms.get(roomid).pathHistory);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { initializeSocketIO };