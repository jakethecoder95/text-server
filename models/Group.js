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
  deactivatedMessage: {
    type: String,
    require: false
  },
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  numberSid: {
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
      required: false
    },
    end: {
      type: Number,
      required: false
    }
  },
  monthlySms: {
    limit: {
      type: Number,
      require: false
    },
    pay: {
      type: Number,
      required: false
    },
    count: {
      type: Number,
      require: false
    }
  }
});

module.exports = mongoose.model("Group", groupSchema);
