const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const _ = require("lodash");

const Person = require("../models/Person");
const Group = require("../models/Group");

exports.addPerson = async (req, res, next) => {
  let { name, number } = req.body;
  const groupId = req.groupId;
  if (number.length === 10) {
    number = "1" + number;
  }
  try {
    const group = await Group.findById(groupId).populate("people");
    if (!group) {
      const error = new Error("No Group found");
      error.statusCode = 401;
      throw error;
    }
    let person = Person.findOne({ number: number });
    if (person) {
      const personInGroup = group.people.find(
        person => person.number === number
      );
      if (personInGroup) {
        const error = new Error("Number already exists in your group");
        error.statusCode = 401;
        throw error;
      }
    }
    person = new Person({ name, number });
    group.people.push(person);
    await person.save();
    await group.save();
    res
      .status(200)
      .json({ message: "Success", group: _.omit(group._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePerson = async (req, res, next) => {
  const personId = req.body.personId;
  const groupId = req.groupId;
  try {
    const group = await Group.findById(groupId).populate("people");
    if (!group) {
      const error = new Error("No Group found");
      error.statusCode = 401;
      throw error;
    }
    group.people = group.people.filter(per => per._id.toString() !== personId);
    await Person.findByIdAndDelete(personId);
    await group.save();
    res
      .status(200)
      .json({ messgae: "Success", group: _.omit(group._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePersonalSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { email, name, oldPassword, newPassword, confirmPassword } = req.body;
  try {
    const group = await Group.findById(req.groupId).populate("people");
    if (!group) {
      const error = new Error("Group was not found");
      error.statusCode = 401;
      throw error;
    }
    group.name = group.name !== name ? name : group.name;
    group.email = group.email !== email ? email : group.email;
    if (oldPassword) {
      if (newPassword !== confirmPassword) {
        const error = new Error("Does not match");
        error.status = 422;
        error.type = "confirmPassword";
        error.value = confirmPassword;
        throw error;
      }
      const matches = await bcrypt.compare(oldPassword, group.password);
      if (!matches) {
        const error = new Error("Incorrect Password");
        error.statusCode = 422;
        error.type = "oldPassword";
        error.value = oldPassword;
        throw error;
      }
      group.password = await bcrypt.hash(newPassword, 12);
    }
    group.save();
    res
      .status(200)
      .json({ message: "Success", group: _.omit(group._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateNexmoSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { nexmoNumber, apiKey, secretKey } = req.body;
  try {
    const group = await Group.findById(req.groupId).populate("people");
    if (!group) {
      const error = new Error("Group was not found");
      error.statusCode = 401;
      throw error;
    }
    group.nexmoNumber =
      group.nexmoNumber !== nexmoNumber ? nexmoNumber : group.apiKey;
    group.secretKey =
      group.secretKey !== secretKey ? secretKey : group.secretKey;
    group.apiKey = group.apiKey !== apiKey ? apiKey : group.apiKey;
    await group.save();
    res
      .status(200)
      .json({ message: "Success", group: _.omit(group._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
