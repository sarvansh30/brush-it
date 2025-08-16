const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomid: { type:String, required: true, unique: true, index: true },
  
  canvasSnapshot:{type:String, default: null},
  
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
