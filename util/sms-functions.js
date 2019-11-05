if (process.env.NODE_ENV !== "production") require("dotenv").config();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio")(twilioAccountSid, twilioAuthToken);

exports.sendSms = (from, to, msg) =>
  twilio.messages.create({
    to,
    from,
    body: msg
  });
