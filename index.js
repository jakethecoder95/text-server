const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const textRoutes = require("./routes/text");
const authRoutes = require("./routes/auth");
const manageRoutes = require("./routes/manage");

require("dotenv").config();

const app = express();

const URI_PASSWORD = process.env.URI_PASSWORD;
const MONGODB_URI = `mongodb+srv://jacob:${URI_PASSWORD}@cluster0-qmdqb.mongodb.net/text`;

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(textRoutes);

app.use("/auth", authRoutes);

app.use("/manage", manageRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const { message, type, value, data } = error;
  res.status(status).json({ message, type, value, data });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(5000, () => console.log("App has started"));
  })
  .catch(err => {
    console.log(err);
  });
