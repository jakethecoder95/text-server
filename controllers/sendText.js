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
    const numbers = req.body.people.map(person => person.number);
    const message = req.body.message;
    const nexmoNumber = req.body.nexmoNumber;
    numbers.forEach(number =>
      nexmo.message.sendSms(
        nexmoNumber,
        number,
        message,
        (err, responseData) => {
          if (err) {
            console.log(err);
          } else {
            console.dir(responseData);
          }
        }
      )
    );
    res.status(200).json({ message: "success!" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
