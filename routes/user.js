const express = require("express");

const isAuth = require("../middleware/is-auth");
const userController = require("../controllers/user");

const router = express.Router();

module.exports = router;
