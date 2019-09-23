const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const _ = require("lodash");

const Person = require("../models/Person");
const Group = require("../models/Group");
const User = require("../models/User");

exports.addPerson = async (req, res, next) => {
  let { name, number, groupId } = req.body;
  number = number.replace(/\D/g, "");
  if (number.length === 10) {
    number = "1" + number;
  }
  console.log(groupId);
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("No Group found");
      error.statusCode = 401;
      throw error;
    }
    const personInGroup = group.people.find(person => person.number === number);
    if (personInGroup) {
      const error = new Error("Number already exists in your group");
      error.statusCode = 401;
      throw error;
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
  const { personId, groupId } = req.body;
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
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
  const { email, name } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("user was not found");
      error.statusCode = 401;
      throw error;
    }
    user.name = user.name !== name ? name : user.name;
    user.email = user.email !== email ? email : user.email;
    user.save();
    res
      .status(200)
      .json({ message: "Success", user: _.omit(user._doc, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("user was not found");
      error.statusCode = 401;
      throw error;
    }
    if (newPassword !== confirmPassword) {
      const error = new Error("Does not match");
      error.status = 422;
      error.type = "confirmPassword";
      error.value = confirmPassword;
      throw error;
    }
    const matches = await bcrypt.compare(oldPassword, user.password);
    if (!matches) {
      const error = new Error("Incorrect Password");
      error.statusCode = 422;
      error.type = "oldPassword";
      error.value = oldPassword;
      throw error;
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.status(200).json({ message: "success" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateGroupName = async (req, res, next) => {
  const { newName, groupId } = req.body;
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("Group was not found");
      error.statusCode = 401;
      throw error;
    }
    if (!newName || newName.length === 0) {
      const error = new Error("Your group must have a name");
      error.statusCode = 403;
      throw error;
    }
    group.name = newName;
    await group.save();
    res.status(200).json({ message: "Success", group });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addAdmin = async (req, res, next) => {
  const { newAdminEmail, groupId } = req.body;
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("Group was not found");
      error.statusCode = 401;
      throw error;
    }
    const user = await User.findOne({ email: newAdminEmail });
    if (!user) {
      const error = new Error("No user found with that email");
      error.statusCode = 403;
      throw error;
    }
    if (group.userId === user._id) {
      const error = new Error("This user is already the group owner.");
      error.statusCode = 403;
      throw error;
    }
    const adminInGroup = group.admins.find(
      admin => admin.email === newAdminEmail
    );
    if (adminInGroup) {
      const error = new Error("This user is already and admin.");
      error.statusCode = 403;
      throw error;
    }
    group.admins.push(user);
    group.save();
    res.status(200).json({ group });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.removeAdmin = async (req, res, next) => {
  const { adminId, groupId } = req.body;
  try {
    const group = await Group.findById(groupId).populate(["people", "admins"]);
    if (!group) {
      const error = new Error("Group was not found");
      error.statusCode = 401;
      throw error;
    }
    group.admins = group.admins.filter(
      admin => admin._id.toString() !== adminId
    );
    group.save();
    res.status(200).json({ group });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
