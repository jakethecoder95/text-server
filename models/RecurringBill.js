const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recurringBillSchema = new Schema({
  groupId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  lastPayed: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 2
  }
});

module.exports = mongoose.model("RecurringBill", recurringBillSchema);
