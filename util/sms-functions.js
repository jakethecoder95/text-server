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

exports.getTextHistory = groupNumber => {
	const date = new Date();
	date.setMonth(d.getMonth() - 3);
  return new Promise(async (resolve, reject) => {
    try {
      const outboundMsg = await twilio.messages.list({
        from: groupNumber,
			  dateSentAfter: date 
      });
      const inboundMsg = await twilio.messages.list({
        to: groupNumber,
				dateSentAfter: date
      });
      resolve([...outboundMsg, ...inboundMsg]);
    } catch (err) {
      reject(err);
    }
  });
};
