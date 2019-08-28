const express = require("express");

const groupControllers = require("../controllers/group");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/fetch-group", isAuth, groupControllers.fetchGroup);

module.exports = router;
