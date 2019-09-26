const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const textHistorySchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  sent: [
    {
      date: {
        type: Date,
        required: true
      },
      sids: [
        {
          type: String,
          required: true
        }
      ]
    }
  ],
  received: [
    {
      date: {
        type: Date,
        required: true
      },
      sid: {
        type: String,
        required: false
      }
    }
  ]
});

module.exports = mongoose.model("TextHistory", textHistorySchema);
