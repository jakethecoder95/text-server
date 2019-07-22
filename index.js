const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const textRoutes = require("./routes/textRoutes");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();

const URI_PASSWORD = process.env.URI_PASSWORD;
const MONGODB_URI = `mongodb+srv://jacob:${URI_PASSWORD}@cluster0-qmdqb.mongodb.net/text`;

app.use(bodyParser.json());

app.use(textRoutes);

app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(5000, () => console.log("App has started"));
  })
  .catch(err => {
    console.log(err);
  });
