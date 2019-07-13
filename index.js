const express = require("express");
const bodyParser = require("body-parser");

const sendTextController = require("./sendTextController");
const receiveTextController = require("./receiveTextController");

const app = express();

app.use(bodyParser.json());

app.post("/send-text", sendTextController);

app.get("/receive-text", receiveTextController);

app.listen(5000, () => console.log("App has started"));
