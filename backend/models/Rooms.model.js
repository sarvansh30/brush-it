const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomid: { type: String, required: true, unique: true, index: true },
  canvasSnapshot: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }, // <-- add this field
});

module.exports = mongoose.model("Room", roomSchema);