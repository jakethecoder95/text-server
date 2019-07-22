const express = require("express");

const authControllers = require("../controllers/auth");

const router = express.Router();

router.put("/signup", authControllers.signup);

module.exports = router;
