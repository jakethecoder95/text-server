const Bucket = require("../models/Bucket");

exports.fetchBucket = async (req, res, next) => {
  try {
    const bucket = await Bucket.findOne({ userId: req.userId });
    if (!bucket) {
      const error = new Error("No bucket found with userId given: " + userId);
      error.statusCode = 403;
      throw error;
    }
    res.status(200).json({ bucket });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
