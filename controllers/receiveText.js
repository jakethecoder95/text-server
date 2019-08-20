const Nexmo = require("nexmo");

const Person = require("../models/Person");
const Group = require("../models/Group");
const sendSingleText = require("../util/send-single-text");

module.exports = async (req, res, next) => {
  const params = Object.assign(req.query, req.body);
  const groupNum = params.to;
  const fromNum = params.msisdn;
  const messageArr = params.text.trim().split(" ");

  try {
    const group = await Group.findOne({ nexmoNumber: groupNum }).populate(
      "people"
    );
    if (!group) {
      const error = new Error("No group was found");
      error.statusCode(401);
      throw error;
    }
    let person = await Person.findOne({ number: fromNum });
    if (messageArr[0] === "1" && !person) {
      // Add number
      let name;
      if (messageArr.length >= 2) {
        messageArr.shift();
        name = messageArr.join(" ");
      } else {
        name = "Unknown";
      }
      person = new Person({ name, number: fromNum });
      group.people.push(person);
      await person.save();
      const joinedGroupMessage = `Welcome to ${
        group.name
      } GroupText! Text 2 at any time to leave the group. [No reply]`;
      sendSingleText(group, fromNum, joinedGroupMessage);
    }
    if (messageArr[0] === "2" && person) {
      // Remove number
      group.people = group.people.filter(
        per => per._id.toString() !== person._id.toString()
      );
      await Person.deleteOne(person);
      const leftGroupMessage = `You successfully left ${
        group.name
      } GroupText! Text 1 and your name at any time to join again. [No reply]`;
      sendSingleText(group, fromNum, leftGroupMessage);
    }
    await group.save();
    res.status(200).send();
  } catch (err) {
    console.dir(err);
    res.status(200).send();
  }
};
