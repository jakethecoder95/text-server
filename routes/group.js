const express = require("express");

const groupControllers = require("../controllers/group");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/create-group", isAuth, groupControllers.createGroup);

router.delete("/delete-group", isAuth, groupControllers.deleteGroup);

router.use("/subscription-updated", groupControllers.subscriptionUpdated);

router.get("/fetch-group", isAuth, groupControllers.fetchGroup);

router.get("/fetch-numbers-list", isAuth, groupControllers.fetchNumberList);

router.post("/update-card", isAuth, groupControllers.updateGroupCard);

router.get("/fetch-card", isAuth, groupControllers.fetchCard);

router.post("/update-payment-plan", isAuth, groupControllers.updatePaymentPlan);

module.exports = router;
