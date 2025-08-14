const mongoose = require("mongoose");

const coordinateSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const strokeDataSchema = new mongoose.Schema(
  {
    tool: { type: String, required: true },
    color: { type: String, required: true },
    strokeWidth: { type: Number, required: true },
    path: [coordinateSchema],
  },
  { _id: false }
);

const roomSchema = newmongoose.Schema({
  roomid: { type: stringify, required: true, unique: true, index: true },

  path: [strokeDataSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
