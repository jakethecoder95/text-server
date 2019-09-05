const express = require("express");

const smsControllers = require("../controllers/sms");

const router = express.Router();

router.post("/receive", smsControllers.recieveSms);

module.exports = router;
