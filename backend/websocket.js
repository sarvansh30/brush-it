const { Server } = require('socket.io');

const initializeSocketIO = (server) => {
  const io = new Server(server, {

    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  const pathHistory = [];
  const redoStack = [];

  io.on('connection', (socket) => {
    console.log('New client connected with socket.io:', socket.id);

    socket.emit('CANVAS_HISTORY', pathHistory);

    socket.on('DRAW_ACTION', (data) => {
      // pathHistory.push(data);
      socket.broadcast.emit('DRAW_ACTION', data);
    });

    socket.on('CANVAS_RESET',()=>{
      pathHistory.length = 0; 
      io.emit('CANVAS_RESET'); 
    })

    socket.on('DRAW_PATH',(data)=>{
      pathHistory.push(data);
      // console.log('Received DRAW_PATH:', pathHistory);
    })

    socket.on('UNDO_ACTION',()=>{
      if (pathHistory.length>0){
        const lastAction = pathHistory.pop();
        redoStack.push(lastAction);
        io.emit('CANVAS_HISTORY', pathHistory);
      }
    });
    
    socket.on('REDO_ACTION',()=>{
      if (redoStack.length > 0) {
        const lastAction = redoStack.pop();
        pathHistory.push(lastAction);
        io.emit('CANVAS_HISTORY', pathHistory);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { initializeSocketIO };