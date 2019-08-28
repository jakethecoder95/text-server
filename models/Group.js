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
  crossroadsGroup: {
    type: Boolean,
    require: true,
    default: false
  },
  name: {
    type: String,
    required: true
  },
  number: String,
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: "Person",
      required: true
    }
  ],
  bucket: {
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
