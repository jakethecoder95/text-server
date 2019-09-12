const _ = require("lodash");

const TextHistory = require("../models/TextHistory");
const Group = require("../models/Group");
const User = require("../models/User");
const { sendSms } = require("../util/sms-functions");
require("../models/Bucket");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const stripe = require("stripe")(process.env.STRIPE_KEY);
const client = require("twilio")(accountSid, authToken);

/*
 * @req.body  name                |  The new group's
 * @req.body  number              |  the Group twilio number
 * @req.body  subscriptionAmount  |  The monthly subscriptionAmount the user wants to pay
 * @req.body  tokenId             |  Stripe payment token
 */
exports.createGroup = async (req, res, next) => {
  const { subscriptionAmount, tokenId, name, number } = req.body,
    { userId } = req,
    smsLimit = Math.floor((subscriptionAmount - 1) / 0.0085);
  try {
    // Validate subscriptionAmount
    console.log(subscriptionAmount);
    if (isNaN(subscriptionAmount) || subscriptionAmount < 5) {
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
    // Purchase twilio number
    // const incomingPhoneNumber = await client.incomingPhoneNumbers.create({
    //   phoneNumber: number,
    //   smsUrl: "https://grouptext.herokuapp.com/sms/receive"
    // });
    // console.log(incomingPhoneNumber);
    // Create stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
      description: "Customer for grouptext.netlify.com",
      source: tokenId // obtained with Stripe.js
    });
    // Create stripe plan
    const plan = await stripe.plans.create({
      amount: subscriptionAmount * 100,
      interval: "month",
      product: {
        name: `${user.name}-plan`
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
    // Create the new Group
    const group = new Group({
      userId,
      name,
      number,
      stripe: {
        customerId: stripeCustomer.id,
        planId: plan.id,
        subscriptionId: stripeSubscription.id
      },
      currentBillingPeriod: {
        start: stripeSubscription.current_period_start,
        end: stripeSubscription.current_period_end
      },
      monthlySms: {
        limit: smsLimit,
        pay: subscriptionAmount,
        count: 0
      }
    });
    // Create text history
    const textHistory = new TextHistory({ groupId: group.id });

    await group.save();
    await textHistory.save();
    res.json({ customer: stripeCustomer, subscription: stripeSubscription });

    // Send welcome text
    await sendSms(
      "+19165874838",
      user.phoneNumber,
      "Welcome! Your first text from your new group"
    );
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.fetchGroup = async (req, res, next) => {
  const userId = req.userId,
    groupId = req.query.groupId;
  try {
    const group = await Group.findById(groupId)
      .populate("bucket")
      .populate("people");
    if (!group) {
      const error = new Error("No Group found!");
      error.statusCode = 401;
      throw error;
    }
    const isGroupOwner = userId === group.userId.toString();
    const isGroupAdmin = group.admins.find(
      adminId => adminId.toString() === userId
    );
    if (!isGroupOwner && !isGroupAdmin) {
      const error = new Error("Access deneid");
      error.statusCode = 403;
      throw error;
    }
    res.status(200).json({ group: group._doc });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.fetchNumberList = async (req, res, next) => {
  const { searchType, searchValue } = req.query;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user found");
      error.statusCode = 401;
      throw Error;
    }
    const availableNumberFinder = await client.availablePhoneNumbers("US");
    console.log(searchValue);
    const numberList = await availableNumberFinder.local.list({
      [searchType]: searchValue || user.phoneNumber,
      smsEnabled: true
    });
    const numbers = numberList.map(({ phoneNumber, locality, postalCode }) => ({
      phoneNumber,
      locality,
      postalCode
    }));
    res.status(200).json({ numbers });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
