const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stripeSchema = new Schema({
  groupId: {
    type: String,
    required: true
  },
  customerId: {
    type: String,
    required: true
  },
  subscriptionId: {
    type: String,
    required: true
  },
  planId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Stripe", stripeSchema);
