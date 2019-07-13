const express = require("express");
const bodyParser = require("body-parser");

const sendTextController = require("./sendTextController");

const app = express();

app.use(bodyParser.json());

app.post("/send-text", sendTextController.sendTexts);

app.listen(5000, () => console.log("App has started"));
