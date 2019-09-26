const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Group = require("../models/Group");
const TextHistory = require("../models/TextHistory");
const Person = require("../models/Person");
const { sendSms } = require("../util/sms-functions");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

exports.sendGroupSms = async (req, res, next) => {
  const { password, people, message, groupId } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user was found");
      error.statusCode = 401;
      throw error;
    }
    // Test the given password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      error.type = "password";
      error.value = password;
      throw error;
    }
    // Get the group from the db
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error("No group was found");
      error.statusCode = 401;
      throw error;
    }
    // Check to make sure group has enough texts left in current cycle
    const smsPerMessageCnt = Math.floor(message.length / 160) + 1;
    group.monthlySms.count += group.people.length * smsPerMessageCnt;
    await group.save();
    // All clear to send to number list
    const messageSIDs = [];
    const failed = [];
    for (let person of people) {
      const { name, number } = person;
      const response = await sendSms(group.number, number, message);
      messageSIDs.push(response.sid);
      if (response.errorMessage) {
        const error = {
          name,
          number,
          message: response.errorMessage
        };
        failed.push(error);
      }
    }
    // Add payment to the groups TextHistory record
    const textHistory = await TextHistory.findOne({ groupId: group._id });
    textHistory.sent.push({
      date: new Date().toISOString(),
      sids: messageSIDs
    });
    await textHistory.save();
    res.status(200).json({ group, failedTexts: failed });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.recieveSms = async (req, res, next) => {
  const { Body, From, To, SID, SmsSid } = req.body,
    messageArr = Body.trim()
      .replace("\n", " ")
      .split(" "),
    from = From.replace("+", ""),
    date = new Date().toISOString(),
    sentMessageSIDs = [];
  let responseMessage,
    totalSms = 0;
  try {
    // Find group
    const group = await Group.findOne({ number: To }).populate([
      "people",
      "userId",
      "admins"
    ]);
    if (!group) {
      console.log("there is no group");
      const error = new Error("No group was found");
      error.statusCode = 401;
      throw error;
    }
    // Add to text from group text amount
    group.monthlySms.count += 1;
    await group.save();
    // Get TextHistory
    const textHistory = await TextHistory.findOne({ groupId: group._id });
    textHistory.received.push({
      date,
      sid: SmsSid
    });
    // Initialize person and check for number in group people list
    let person;
    const personInGroup = group.people.find(per => per.number === from);
    if (personInGroup) {
      person = await Person.findById(personInGroup._id);
    }
    // Add or edit person if message begins with 1
    if (messageArr[0] === "1") {
      // Get the name
      let name;
      if (messageArr.length >= 2) {
        messageArr.shift();
        messageArr.slice(0, 2);
        name = messageArr.join(" ").trim();
      } else {
        name = "Unknown";
      }
      // Update or add person
      if (person) {
        person.name = name;
        responseMessage = `Your info was updated!`;
      } else {
        person = new Person({ name, number: from });
        group.people.push(person);
        responseMessage = `Welcome to ${group.name} GroupText! Text 2 at any time to leave the group. [No reply]`;
      }
      await person.save();
    }
    // Remove person from group list if message starts with 2
    if (messageArr[0] === "2" && person) {
      group.people = group.people.filter(
        per => per._id.toString() !== person._id.toString()
      );
      await Person.deleteOne(person);
      responseMessage = `You successfully left ${group.name} GroupText! Text 1 and your name at any time to join again. [No reply]`;
    }
    // Send group text if group message starts with "SEND"
    if (messageArr[0] === "SEND") {
      let numberAuthorized = false;
      // Check if number is from group owner
      if (from === group.userId.phoneNumber) {
        numberAuthorized = true;
      } else {
        // Check if number is from group admin
        const admin = group.admins.find(admin => admin.phoneNumber);
        if (admin) {
          numberAuthorized = true;
        }
      }
      if (!numberAuthorized) {
        const error = new Error("Number not authorized to send");
        error.statusCode = 403;
        throw error;
      }
      // Get message
      const { people, monthlySms } = group;
      messageArr.shift();
      messageArr.slice(0, 2);
      message = messageArr.join(" ").trim();
      // Check to make sure the group has enough texts for this month
      const smsPerMessageCnt = Math.floor(message.length / 160) + 1;
      totalSms += people.length * smsPerMessageCnt;
      if (monthlySms.limit < monthlySms.count + totalSms) {
        const error = new Error(
          "Group does not have enough texts in current pay cycle"
        );
        error.statusCode = 403;
        throw error;
      }

      // All clear to send to number list
      for (let person of people) {
        const { number } = person;
        const response = await sendSms(group.number, number, message);
        sentMessageSIDs.push(response.sid);
      }
      console.log("Sent Messages");
      responseMessage = "Your messages were sent!";
    }
    // Send responseMessage
    if (responseMessage) {
      const response = await sendSms(group.number, from, responseMessage);
      sentMessageSIDs.push(response.sid);
      totalSms += 1;
      // Add to sent messages Group textHistory
      textHistory.sent.push({
        date,
        sids: sentMessageSIDs
      });
    }
    group.monthlySms.count += totalSms;
    await group.save();
    await textHistory.save();
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
