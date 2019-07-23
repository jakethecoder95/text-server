const Group = require("../models/Group");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const { email, password, name, nexmoNumber, apiKey, secretKey } = req.body;
  try {
    const hashedPsw = await bcrypt.hash(password, 12);
    const group = new Group({
      email,
      password: hashedPsw,
      name,
      nexmoNumber,
      apiKey,
      secretKey
    });
    await group.save();
    res.status(200).json({ message: "success", group });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const group = await Group.find({ email });
    // Throw error if no group is found with given email
    if (!group) {
      const error = new Error("No group could be found by that email address");
      error.statusCode = 401;
      throw error;
    }
    const match = bcrypt.compare(password, group.password);
    // Throw error if password does not match
    if (!match) {
      const error = new Error("Incorrect Password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      "secret"
    );
    res
      .status(200)
      .json({ message: "Login Successfull!", group: { ...group }, token });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};
