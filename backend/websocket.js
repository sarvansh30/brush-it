const { Server } = require('socket.io');

const initializeSocketIO = (server) => {
  const io = new Server(server, {

    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected with socket.io:', socket.id);


    socket.on('DRAW_ACTION', (data) => {

      socket.broadcast.emit('DRAW_ACTION', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { initializeSocketIO };