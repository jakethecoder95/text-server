const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appDataSchema = new Schema({
  sentTxts: {
    type: Number,
    required: true,
    default: 0
  },
  recievedTxts: {
    type: Number,
    required: true,
    default: 0
  },
  bucket: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model("AppData", appDataSchema);
