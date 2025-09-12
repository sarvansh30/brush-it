const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomid: { type: String, required: true, unique: true, index: true },
  canvasSnapshot: { type: String, default: null },
  canvasWidth: { type: Number},
  canvasHeight: { type: Number},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model("Room", roomSchema);