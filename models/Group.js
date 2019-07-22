const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  email: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  },
  name: {
    type: String,
    required: true
  },
  nexmoNumber: {
    type: String,
    required: true
  },
  apiKey: {
    type: String,
    require: true
  },
  secretKey: {
    type: String,
    require: true
  },
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});

module.exports = mongoose.model("Group", groupSchema);
