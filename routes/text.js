const express = require("express");

const sendTextController = require("../controllers/sendText");
const receiveTextController = require("../controllers/receiveText");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/send-text", isAuth, sendTextController);

router.get("/receive-text", receiveTextController);

module.exports = router;
