const express = require("express");

const subgroupControllers = require("../controllers/subgroup");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put("/create", isAuth, subgroupControllers.putCreateSubgroup);

router.delete("/delete", isAuth, subgroupControllers.deleteRemoveSubgroup);

router.post("/add-person", isAuth, subgroupControllers.postAddPersonToSubgroup);

router.delete(
  "/remove-person",
  isAuth,
  subgroupControllers.removePersonFromSubgroup
);

router.get("/fetch-subgroup", isAuth, subgroupControllers.getFetchSubgroup);

router.get(
  "/fetch-all-subgroups",
  isAuth,
  subgroupControllers.getFetchAllSubgroups
);

module.exports = router;
