const MessagingResponse = require("twilio").twiml.MessagingResponse;

const User = require("../models/User");
const Group = require("../models/Group");
const Bucket = require("../models/Bucket");
const Billing = require("../models/Billing");
const Person = require("../models/Person");
const { sendSms } = require("../util/sms-functions");

exports.sendGroupSms = async (req, res, next) => {
  const password = req.body.password;
  const { people, message } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("No user was found");
      error.statusCode = 401;
      throw error;
    }

    // Test the given password
    const match = await bcrypt.compare(password, group.password);
    if (!match) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      error.type = "password";
      error.value = password;
      throw error;
    }

    // Get the group from the db
    const group = await Group.findById(user.groupId);
    if (!group) {
      const error = new Error("No group was found");
      error.statusCode = 401;
      throw error;
    }

    // Check to make sure there is enough in group bucket to complete the transaction
    const bucket = await Bucket.findById(group.bucketId);
    if (!bucket) {
      const error = new Error("Group buket was not found");
      error.statusCode = 403;
      throw error;
    }
    const smsPerMessageCnt = Math.floor(message.length / 160) + 1;
    const totalPrice =
      group.payment.smsPrice * smsPerMessageCnt * people.length;
    if (bucket.amount < totalPrice) {
      const error = new Error("Not enough money in bucket");
      error.statusCode = 403;
      throw error;
    }
    bucket.amount -= totalPrice;
    await bucket.save();

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
      console.log(response);
    }

    // Add payment to the groups billing record
    const billing = Billing.findOne(group._id);
    billing.sent.push({
      date: new Date().toISOString(),
      amount: totalPrice,
      sids: messageSIDs
    });
    await billing.save();

    res.status(200).json({ bucket, failedTexts: failed });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.recieveSms = async (req, res, next) => {
  const { Body, From, To, SID } = req.body,
    messageArr = Body.trim()
      .replace("\n", " ")
      .split(" "),
    from = From.replace("+", ""),
    to = To.replace("+", ""),
    date = new Date().toISOString(),
    sentMessageSIDs = [];

  let responseMessage,
    totalPrice = 0;
  try {
    // Find group
    const group = await Group.findOne({ number: to }).populate("people");
    if (!group) {
      console.log("there is no group");
      const error = new Error("No group was found");
      error.statusCode = 401;
      throw error;
    }

    // Find Bucket and deduce recieving price
    const bucket = await Bucket.findById(group.bucketId);
    bucket.amount -= group.payment.smsPrice;
    await bucket.save();

    // Get Billing
    const billing = await Billing.findOne({ groupId: group._id });
    billing.recieved.push({
      date,
      amount: group.payment.smsPrice,
      sid: SID
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
      await group.populate("owner");
      let numberAuthorized = false;
      // Check if number is from group owner
      if (from === group.owner.phoneNumber) {
        numberAuthorized = true;
      } else {
        // Check if number is from group admin
        await group.populate("admins");
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
      const { people, payment } = group;
      messageArr.shift();
      messageArr.slice(0, 2);
      message = messageArr.join(" ").trim();
      // Check to make sure there is enough in group bucket to complete the transaction
      const smsPerMessageCnt = Math.floor(message.length / 160) + 1;
      totalPrice += payment.textPrice * smsPerMessageCnt * people.length;
      if (bucket.amount < totalPrice) {
        const error = new Error("Not enough money in bucket");
        error.statusCode = 403;
        throw error;
      }

      // All clear to send to number list
      for (let person of people) {
        const { number } = person;
        const response = await sendSms(group.number, number, message);
        sentMessageSIDs.push(response.sid);
        console.log(response);
      }
      responseMessage = "Your messages were sent!";
    }

    // Send responseMessage
    if (responseMessage) {
      const response = await sendSms(group.number, from, responseMessage);
      sentMessageSIDs.push(response.sid);
      totalPrice += group.payment.smsPrice;
      bucket.amount -= totalPrice;
      // Add to Group bill for sent message(s)
      billing.sent.push({
        date,
        amount: totalPrice,
        sids: sentMessageSIDs
      });
    }

    await group.save();
    await bucket.save();
    await billing.save();
    res.status(200).json({ message: responseMessage, number: from });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
