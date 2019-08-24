const Nexmo = require("nexmo");

const Person = require("../models/Person");
const Group = require("../models/Group");
const sendSingleText = require("../util/send-single-text");

module.exports = async (req, res, next) => {
  const params = Object.assign(req.query, req.body),
    groupNum = params.to,
    fromNum = params.msisdn,
    messageArr = params.text.trim().split(" ");
  let responseMessage;

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
    if (messageArr[0] === "1") {
      // Add number
      let name;
      if (messageArr.length >= 2) {
        messageArr.shift();
        messageArr.slice(0, 2);
        name = messageArr.join(" ");
      } else {
        name = "Unknown";
      }
      if (person) {
        person.name = name;
      } else {
        person = new Person({ name, number: fromNum });
        group.people.push(person);
        responseMessage = `Welcome to ${group.name} GroupText! Text 2 at any time to leave the group. [No reply]`;
        sendSingleText(group, fromNum, responseMessage);
      }
      await person.save();
    }
    if (messageArr[0] === "2" && person) {
      // Remove number
      group.people = group.people.filter(
        per => per._id.toString() !== person._id.toString()
      );
      await Person.deleteOne(person);
      responseMessage = `You successfully left ${group.name} GroupText! Text 1 and your name at any time to join again. [No reply]`;
      sendSingleText(group, fromNum, responseMessage);
    }
    await group.save();
    res.status(200).send();
  } catch (err) {
    console.dir(err);
    res.status(200).send();
  }
};
