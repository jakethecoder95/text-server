const express = require("express");
const { body } = require("express-validator/check");

const isAuth = require("../middleware/is-auth");
const manageControllers = require("../controllers/manage");

const router = express.Router();

router.put("/add-person", isAuth, manageControllers.addPerson);

router.delete("/delete-person", isAuth, manageControllers.deletePerson);

router.post(
  "/update-personal-settings",
  isAuth,
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail(),
    body("name")
      .trim()
      .not()
      .isEmpty()
  ],
  manageControllers.updatePersonalSettings
);

router.post("/update-group-name", isAuth, manageControllers.updateGroupName);

router.post("/update-user-password", isAuth, manageControllers.updatePassword);

router.post("/add-admin", isAuth, manageControllers.addAdmin);

router.delete("/remove-admin", isAuth, manageControllers.removeAdmin);

router.post("/merge-armory", manageControllers.mergeArmory);

router.post("/merge-hsm", manageControllers.mergeHsm);

router.get("/get-all-people", manageControllers.getAllPeople);

module.exports = router;
