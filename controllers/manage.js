const _ = require("lodash");

const Person = require("../models/Person");
const Group = require("../models/Group");

exports.addPerson = async (req, res, next) => {
  const { name, number } = req.body;
  const groupId = req.groupId;
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error("No Group found");
      error.statusCode = 401;
      throw error;
    }
    const person = new Person({ name, number });
    group.people.push(person._id);
    await person.save();
    await group.save();
    res
      .status(200)
      .json({ message: "Success", group: _.omit(group, "password") });
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
    const group = await Group.findById(groupId);
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
      .json({ messgae: "Success", group: _.omit(group, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
