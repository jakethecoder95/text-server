const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appDataSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  }
});

module.exports = mongoose.model("AppData", appDataSchema);
