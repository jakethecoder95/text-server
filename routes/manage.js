const express = require("express");

const isAuth = require("../middleware/is-auth");
const manageControllers = require("../controllers/manage");

const router = express.Router();

router.put("/add-person", isAuth, manageControllers.addPerson);

router.delete("/delete-person", isAuth, manageControllers.deletePerson);

module.exports = router;
