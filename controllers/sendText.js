const Nexmo = require("nexmo");
const bcrypt = require("bcryptjs");

const Group = require("../models/Group");

module.exports = async (req, res, next) => {
  const password = req.body.password;
  try {
    const group = await Group.findById(req.groupId);
    if (!group) {
      const error = new Error("No group was found");
      error.statusCode = 401;
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
    // Send the nexmo messages
    const nexmo = new Nexmo(
      {
        apiKey: req.body.apiKey,
        apiSecret: req.body.secretKey
      },
      { debug: true }
    );
    const { people, message, nexmoNumber } = req.body;
    const failedTxts = [];
    for (let i = 0; i < people.length; i++) {
      const { number, name } = people[i];
      nexmo.message.sendSms(nexmoNumber, number, message, function(
        err,
        responseData
      ) {
        if (err) {
          console.log(err);
        }
        if (responseData.messages[0]["error-text"]) {
          const errString = `Error Status: ${
            responseData.messages[0].status
          }. ${responseData.messages[0]["error-text"]}`;
          failedTxts.push({ name, number, message: errString });
        }
        if (i === people.length - 1) {
          res.status(200).json({ message: "success!", failedTxts });
        }
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
