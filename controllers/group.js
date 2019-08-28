const _ = require("lodash");

const Group = require("../models/Group");
require("../models/Bucket");

exports.fetchGroup = async (req, res, next) => {
  const userId = req.userId,
    groupId = req.query.groupId;
  try {
    const group = await Group.findById(groupId).populate("bucket");
    if (!group) {
      const error = new Error("No Group found!");
      error.statusCode = 401;
      throw error;
    }
    const isGroupOwner = userId === groupId;
    const isGroupAdmin = group.admins.find(
      adminId => adminId.toString() === userId
    );
    if (!isGroupOwner && !isGroupAdmin) {
      const error = new Error("Access deneid");
      error.statusCode = 403;
      throw error;
    }
    res.status(200).json({ group: group._doc });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
