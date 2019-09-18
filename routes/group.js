const express = require("express");

const groupControllers = require("../controllers/group");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/create-group", isAuth, groupControllers.createGroup);

router.use("/subscription-updated", groupControllers.subscriptionUpdated);

router.get("/fetch-group", isAuth, groupControllers.fetchGroup);

router.get("/fetch-numbers-list", isAuth, groupControllers.fetchNumberList);

module.exports = router;
