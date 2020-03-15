const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const manageRoutes = require("./routes/manage");
const groupRoutes = require("./routes/group");
const smsRoutes = require("./routes/sms");

if (process.env.NODE_ENV !== "production") require("dotenv").config();

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/octet-stream") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ fileFilter: fileFilter, dest: "tmp/csv/" }).single("file"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", authRoutes);

app.use("/manage", manageRoutes);

app.use("/group", groupRoutes);

app.use("/sms", smsRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const { message, type, value, data } = error;
  res.status(status).json({ message, type, value, data });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(PORT, () => console.log("App has started"));
  })
  .catch(err => {
    console.log(err);
  });
