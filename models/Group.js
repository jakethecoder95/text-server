const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    require: true,
    ref: "User"
  },
  activated: {
    type: Boolean,
    require: true,
    default: true
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
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],
  currentBillingPeriod: {
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    }
  },
  monthlySms: {
    limit: {
      type: Number,
      require: true
    },
    pay: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      require: true
    }
  }
});

module.exports = mongoose.model("Group", groupSchema);
