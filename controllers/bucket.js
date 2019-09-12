const stripe = require("stripe")("sk_test_ICMlYQzeelKwClW7quwfLzAM");

const Bucket = require("../models/Bucket");
const Billing = require("../models/Billing");
const User = require("../models/User");
const Group = require("../models/Group");

exports.addToBucket = async (req, res, next) => {
  const { amount, tokenId } = req.body;
  try {
    // Validate amount
    if (isNaN(amount) || amount < 5) {
      const error = new Error("Invalid Amount");
      error.statusCode = 403;
      throw error;
    }

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user was found");
      error.statusCode = 401;
      throw error;
    }

    // Create stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
      description: "Customer for grouptext.netlify.com",
      source: tokenId // obtained with Stripe.js
    });

    // Create stripe plan
    const plan = await stripe.plans.create({
      amount: amount * 100,
      interval: "month",
      product: {
        name: `${user.name}-plan` /* TODO: Change to <group name>-plan */
      },
      currency: "usd"
    });

    // Create stripe monthly subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          plan: plan.id
        }
      ]
    });

    res.json({ customer: stripeCustomer, subscription: stripeSubscription });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
