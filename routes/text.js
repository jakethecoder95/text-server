const express = require("express");

const sendTextController = require("../controllers/sendText");
const receiveTextController = require("../controllers/receiveText");

const router = express.Router();

router.post("/send-text", sendTextController);

router.get("/receive-text", receiveTextController);

module.exports = router;
