const _ = require("lodash");

const Person = require("../models/Person");
const Group = require("../models/Group");

exports.addPerson = async (req, res, next) => {
  const { name, number } = req.body;
  const groupId = req.groupId;
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
      .json({ messgae: "Success", group: _.omit(group, "password") });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
