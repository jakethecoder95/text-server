const express = require("express");

const BucketControllers = require("../controllers/bucket");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/add-to-bucket", isAuth, BucketControllers.addToBucket);

module.exports = router;
