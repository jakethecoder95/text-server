if (process.env.NODE_ENV !== "production") require("dotenv").config();

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require("twilio")(accountSid, authToken);

exports.sendSms = async (from, to, msg) =>
  await client.messages.create({
    to,
    from,
    body: msg
  });
