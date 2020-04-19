const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subgroupSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: "Group"
  },
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: "Person",
      required: true
    }
  ]
});

module.exports = mongoose.model("Subgroup", subgroupSchema);
