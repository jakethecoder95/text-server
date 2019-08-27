const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const billingSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  sent: [
    {
      date: {
        type: Date,
        required: true
      },
      amt: {
        type: Number,
        required: true
      }
    }
  ],
  received: [
    {
      date: {
        type: Date,
        required: true
      },
      amt: {
        type: Number,
        required: true
      }
    }
  ]
});

module.exports = mongoose.model("Billing", billingSchema);
