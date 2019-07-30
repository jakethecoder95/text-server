const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator/check");
const _ = require("lodash");

const Group = require("../models/Group");
require("../models/Person");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { email, password, name, nexmoNumber, apiKey, secretKey } = req.body;
  let newNexmoNumber = nexmoNumber.replace(/\D/g, "");
  if (newNexmoNumber[0] !== "1") {
    newNexmoNumber = "1" + newNexmoNumber;
  }
  try {
    const hashedPsw = await bcrypt.hash(password, 12);
    const group = new Group({
      email,
      password: hashedPsw,
      name,
      nexmoNumber: newNexmoNumber,
      apiKey,
      secretKey
    }).populate("people");
    await group.save();
    const token = jwt.sign(
      {
        email: group.email,
        groupId: group._id.toString()
      },
      "secret"
    );
    res
      .status(200)
      .json({ message: "success", group: _.omit(group, "password"), token });
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
    const group = await Group.findOne({ email }).populate("people");
    // Throw error if no group is found with given email
    if (!group) {
      const error = new Error("No group could be found by that email address");
      error.statusCode = 401;
      error.type = "email";
      error.value = email;
      throw error;
    }
    const match = await bcrypt.compare(password, group.password);
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
        email: group.email,
        groupId: group._id.toString()
      },
      "secret"
    );
    res.status(200).json({
      message: "Login Successfull!",
      group: _.omit(group._doc, "password"),
      token
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.initGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.groupId).populate("people");
    if (!group) {
      const error = new Error("Group was not found by that");
      error.statusCode = 401;
      throw error;
    }
    res.status(200).json({ group: _.omit(group._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
