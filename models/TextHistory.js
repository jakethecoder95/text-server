const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const textHistorySchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  sentHistory: [
    {
      type: String,
      required: true
    }
  ],
  recievedHistory: [
    {
      type: String,
      required: true
    }
  ]
});

module.exports = mongoose.model("TextHistory", textHistorySchema);
