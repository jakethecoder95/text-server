const express = require("express");
const { body } = require("express-validator/check");

const User = require("../models/User");
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
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
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
  authControllers.signup,
  authControllers.initUser
);

router.post("/login", authControllers.signin, authControllers.initUser);

router.get("/init-user", isAuth, authControllers.initUser);

module.exports = router;
