const Group = require("../models/Group");
const bcrypt = require("bcryptjs");

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
