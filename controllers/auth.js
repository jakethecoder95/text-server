const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator/check");
const mongoose = require("mongoose");
const _ = require("lodash");

const Group = require("../models/Group");
const User = require("../models/User");
const Bucket = require("../models/Bucket");
require("../models/Person");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { email, password, name, phoneNumber } = req.body;
  let newPhoneNumber = phoneNumber.replace(/\D/g, "");
  if (newPhoneNumber[0] !== "1") {
    newPhoneNumber = "1" + newPhoneNumber;
  }
  try {
    const hashedPsw = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPsw,
      name,
      phoneNumber: newPhoneNumber
    });
    const bucket = new Bucket({ userId: user._id, name: user.name });
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      process.env.JWT_SECRET
    );
    await bucket.save();
    await user.save();
    req.bucket = bucket;
    req.token = token;
    req.userId = user._id;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate("people");
    // Throw error if no user is found with given email
    if (!user) {
      const error = new Error("No user could be found by that email address");
      error.statusCode = 401;
      error.type = "email";
      error.value = email;
      throw error;
    }
    const match = await bcrypt.compare(password, user.password);
    // Throw error if password does not match
    if (!match) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      error.type = "password";
      error.value = password;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      process.env.JWT_SECRET
    );
    req.userId = user._id.toString();
    req.token = token;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.initUser = async (req, res, next) => {
  const groups = [];
  const token = req.token; // Only on signup/login
  const bucket = req.bucket; // Only on signup
  try {
    const user = await User.findById(req.userId).populate("people");
    if (!user) {
      const error = new Error("User was not found by that");
      error.statusCode = 401;
      throw error;
    }
    const ownedGroups = await Group.find(
      {
        userId: user._id
      },
      "_id name"
    );
    const adminGroups = await Group.find(
      {
        admins: mongoose.Types.ObjectId(user._id)
      },
      "_id name"
    );
    groups.push(...ownedGroups);
    groups.push(...adminGroups);
    res
      .status(200)
      .json({ user: _.omit(user._doc, "password"), groups, token, bucket });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
