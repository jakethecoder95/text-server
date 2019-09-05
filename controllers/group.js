const _ = require("lodash");

const Group = require("../models/Group");
const User = require("../models/User");
require("../models/Bucket");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require("twilio")(accountSid, authToken);

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
    const numberList = await availableNumberFinder.local.list({
      [searchType]: searchValue
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
