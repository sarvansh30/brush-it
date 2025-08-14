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
        socket.emit('CANVAS_HISOTRY', rooms.get(roomid).history);
        console.log(`Client ${socket.id} joined room ${roomid}`);
      }
      else{
        rooms.set(roomid,{history:[],redoStack:[]});
        console.log(`Room ${roomid} created and client ${socket.id} joined`);
        socket.join(roomid);
      }
    });

    // socket.emit('CANVAS_HISTORY', pathHistory);

    socket.on('DRAW_ACTION', (data) => {
      // pathHistory.push(data);
      socket.to(roomid).broadcast.emit('DRAW_ACTION', data);
    });

    socket.on('CANVAS_RESET',()=>{
      pathHistory.length = 0; 
      io.to(roomid).emit('CANVAS_RESET'); 
    })

    socket.on('DRAW_PATH',(data)=>{
      rooms.get(roomid).history.push(data);
      // console.log('Received DRAW_PATH:', pathHistory);
    })

    socket.on('UNDO_ACTION',()=>{
      if (rooms.get(roomid).history.length>0){
        const lastAction = rooms.get(roomid).history.pop();
        rooms.get(roomid).redoStack.push(lastAction);
        io.to(roomid).emit('CANVAS_HISTORY', pathHistory);
      }
    });
    
    socket.on('REDO_ACTION',()=>{
      if (redoStack.length > 0) {
        const lastAction = rooms.get(roomid).redoStack.pop();
        rooms.get(roomid).history.push(lastAction);
        io.to(roomid).emit('CANVAS_HISTORY', pathHistory);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { initializeSocketIO };