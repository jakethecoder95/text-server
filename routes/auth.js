const express = require("express");
const { body } = require("express-validator/check");

const Group = require("../models/Group");
const authControllers = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return Group.findOne({ email: value }).then(groupDoc => {
          if (groupDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("phoneNumber")
      .trim()
      .isMobilePhone()
      .not()
      .isEmpty(),
    body("password")
      .trim()
      .isLength({ min: 6 }),
    body("name")
      .trim()
      .not()
      .isEmpty()
  ],
  authControllers.signup
);

router.post("/login", authControllers.signin);

router.get("/init-group", isAuth, authControllers.initGroup);

module.exports = router;
