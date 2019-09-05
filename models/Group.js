const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    require: true
  },
  activated: {
    type: Boolean,
    require: true,
    default: false
  },
  payment: {
    plan: {
      type: String,
      required: true,
      default: "standard"
    },
    smsPrice: {
      type: Number,
      required: true,
      default: 0.025
    },
    numberPrice: {
      type: Number,
      required: true,
      default: 2
    }
  },
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: "Person",
      required: true
    }
  ],
  bucketId: {
    type: Schema.Types.ObjectId,
    ref: "Bucket",
    required: true
  },
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ]
});

module.exports = mongoose.model("Group", groupSchema);
