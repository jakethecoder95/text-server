const _ = require("lodash");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const TextHistory = require("../models/TextHistory");
const Group = require("../models/Group");
const User = require("../models/User");
const Stripe = require("../models/Stripe");
const { sendSms } = require("../util/sms-functions");
require("../models/Stripe");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_KEY
    }
  })
);

/*
 * @req.body  name                |  The new group's
 * @req.body  number              |  the Group twilio number
 * @req.body  subscriptionAmount  |  The monthly subscriptionAmount the user wants to pay
 * @req.body  tokenId             |  Stripe payment token
 */
exports.createGroup = async (req, res, next) => {
  const { subscriptionAmount, tokenId, name, number } = req.body,
    { userId } = req,
    smsLimit = Math.floor((subscriptionAmount - 1.3) / 0.008);
  try {
    // Validate subscriptionAmount
    if (isNaN(subscriptionAmount) || subscriptionAmount < 3) {
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
    // Initialize group so we can use its id as metadata
    const group = new Group({
      userId,
      name,
      number
    });
    // Purchase twilio number
    const newNumber = await twilio.incomingPhoneNumbers.create({
      phoneNumber: number,
      smsUrl: "https://grouptext.herokuapp.com/sms/receive"
    });
    group.numberSid = newNumber.sid;
    await group.save();
    const metadata = {
      userId: user._id.toString(),
      groupId: group._id.toString()
    };
    // Create stripe customer
    const stripeCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
      description: "Customer for grouptext.netlify.com",
      source: tokenId, // obtained with Stripe.js
      metadata
    });
    // Create stripe plan
    const plan = await stripe.plans.create({
      amount: subscriptionAmount * 100,
      interval: "month",
      product: {
        name: `${user.name}-plan`
      },
      currency: "usd",
      metadata
    });
    // Create stripe monthly subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [
        {
          plan: plan.id
        }
      ],
      metadata
    });
    // Update the new Group and new TextHistory
    group.currentBillingPeriod = {
      start: stripeSubscription.current_period_start,
      end: stripeSubscription.current_period_end
    };
    group.monthlySms = {
      limit: smsLimit,
      pay: subscriptionAmount,
      count: 0
    };
    // Initialize group stripe info
    const stripeInfo = new Stripe({
      userId: user._id,
      groupId: group._id,
      customerId: stripeCustomer.id,
      planId: plan.id,
      subscriptionId: stripeSubscription.id
    });
    const textHistory = new TextHistory({ groupId: group.id });
    await group.save();
    await stripeInfo.save();
    await textHistory.save();
    res.json({ group });

    // Send welcome text
    await sendSms(
      group.number,
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

exports.deleteGroup = async (req, res, next) => {
  const { password, groupId } = req.body;
  try {
    // Get the user
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user was found");
      error.statusCode = 401;
      throw error;
    }
    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error("No Group was found");
      error.statusCode = 401;
      throw error;
    }
    // Get group's Stipe Info
    const stripeInfo = await Stripe.findOne({ groupId });
    if (!stripeInfo) {
      const error = new Error("No stripe info was fround");
      error.statusCode = 401;
      throw error;
    }
    // Get textHistory
    const textHistory = await TextHistory.findOne({ groupId });
    // Check to see if user is Group owner
    if (group.userId.toString() !== user._id.toString()) {
      const error = new Error("Must be the group owner to delete group.");
      error.statusCode = 401;
      error.type = "Access Denied: Must be group owner.";
      throw error;
    }
    // Check to see if password matches user
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      error.type = "password";
      error.value = password;
      throw error;
    }
    // Cancel twilio phone number
    await twilio.incomingPhoneNumbers(group.numberSid).remove();
    // Delete all stripe info
    await stripe.subscriptions.del(stripeInfo.subscriptionId);
    await stripe.plans.del(stripeInfo.planId);
    await stripe.customers.del(stripeInfo.customerId);
    await Stripe.findByIdAndDelete(stripeInfo._id.toString());
    // Delete TextHistory
    await TextHistory.findOneAndDelete(textHistory._id.toString());
    // Delete group
    await Group.findOneAndDelete(groupId);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.subscriptionUpdated = async (req, res, next) => {
  const subscription = req.body.data.object;
  let responseMessage = "Update received: UNHANDLED";
  try {
    // Find group
    const group = await Group.findById(subscription.metadata.groupId);
    if (!group) {
      const error = new Error(
        "There was no group found by stripe info groupId"
      );
      error.statusCode = 500;
      throw error;
    }
    // If new billing cycle: Update group monthlySms.count & currentBillingPeriod.start and .end
    if (subscription.current_period_end !== group.currentBillingPeriod.end) {
      group.monthlySms.count = 0;
      group.currentBillingPeriod = {
        start: subscription.current_period_start,
        end: subscription.current_period_end
      };
      responseMessage = "Successfully updated billing cycle";
    }
    await group.save();
    res.status(200).json({ message: responseMessage });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.paymentSucceeded = async (req, res, next) => {
  const {
    amount_paid,
    date,
    customer_email,
    invoice_pdf,
    hosted_invoice_url
  } = req.body.data.object;
  try {
    const response = await transporter.sendMail({
      to: "95jacob07@gmail.com",
      from: "noreply@grouptext.com",
      subject: "GroupText Receipt",
      html: `
        <h3>Your GroupText Receipt</h3>
        <p>Hey, just want to let you know that your card was charged for this month's GroupText fees.</p>
        <ul>
          <li>Amount:$${(amount_paid / 100).toFixed(2)}</li>
          <li>Date Charged: ${new Date(date * 1000)}</li>
          <li>Receipt URL: ${hosted_invoice_url}</li>
          <li>Receipt PDF: ${invoice_pdf}
        </ul>
        <p>If you have any questions or issues please contact me at "95jacob07@gmail.com"</p>
        <p>Thanks for using GroupText!</p>
      `
    });
    res.status(200).json({ message: "Successfully sent email", response });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
  res.status(200).send();
};

exports.fetchGroup = async (req, res, next) => {
  const userId = req.userId,
    groupId = req.query.groupId;
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("No Group found!");
      error.statusCode = 401;
      throw error;
    }
    const isGroupOwner = userId === group.userId.toString();
    const isGroupAdmin = group.admins.find(
      admin => admin._id.toString() === userId
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
    const availableNumberFinder = await twilio.availablePhoneNumbers("US");
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

exports.updateGroupCard = async (req, res, next) => {
  const { stripeCustomerId, stripeToken, oldCardId } = req.body;
  try {
    await stripe.customers.deleteSource(stripeCustomerId, oldCardId);
    await stripe.customers.createSource(stripeCustomerId, {
      source: stripeToken
    });
    res.status(200).json({ message: "Your card was updated!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.fetchCard = async (req, res, next) => {
  const { groupId } = req.query;
  try {
    const stripeInfo = await Stripe.findOne({ groupId });
    if (!stripeInfo) {
      const error = new Error("No stripe info was fround");
      error.statusCode = 401;
      throw error;
    }
    const stripeCustomer = await stripe.customers.retrieve(
      stripeInfo.customerId
    );
    const card = await stripe.customers.retrieveSource(
      stripeInfo.customerId,
      stripeCustomer.default_source
    );
    res.status(200).json({ card });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePaymentPlan = async (req, res, next) => {
  const { groupId, amount } = req.body;
  // Validate subscriptionAmount
  if (isNaN(amount) || amount < 3) {
    const error = new Error("Invalid Amount");
    error.statusCode = 403;
    throw error;
  }
  const smsLimit = Math.floor((amount - 1.3) / 0.008);
  try {
    // Find the group
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("No Group was found");
      error.statusCode = 401;
      throw error;
    }
    // Get group's stripe info
    const stripeInfo = await Stripe.findOne({ groupId });
    if (!stripeInfo) {
      const error = new Error("No stripe info was fround");
      error.statusCode = 401;
      throw error;
    }
    // Delete old plan
    await stripe.plans.del(stripeInfo.planId);
    // Create stripe plan
    const plan = await stripe.plans.create({
      amount: amount * 100,
      interval: "month",
      product: {
        name: `${group.name}-plan`
      },
      currency: "usd",
      metadata: { groupId }
    });
    // Update stripe monthly subscription
    const subscription = await stripe.subscriptions.retrieve(
      stripeInfo.subscriptionId
    );
    stripe.subscriptions.update(stripeInfo.subscriptionId, {
      cancel_at_period_end: false,
      items: [
        {
          id: subscription.items.data[0].id,
          plan: plan.id
        }
      ]
    });
    // Update stripe info
    stripeInfo.planId = plan.id;
    // Update group
    group.monthlySms.limit = smsLimit;
    group.monthlySms.pay = amount;
    await group.save();
    await stripeInfo.save();
    res.status(200).json({ message: "Payment plan was updated", group });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
