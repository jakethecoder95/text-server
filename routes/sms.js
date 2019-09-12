const express = require("express");

const smsControllers = require("../controllers/sms");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/send-group", isAuth, smsControllers.sendGroupSms);

router.post("/receive", smsControllers.recieveSms);

module.exports = router;
