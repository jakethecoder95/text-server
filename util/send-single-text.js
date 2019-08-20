const Nexmo = require("nexmo");

/*  Summary: Sends a single text.
 *
 * @param   {Object} | group | All group info
 * @param   {string} | to | Number to send text to
 * @param   {string} | message | Message for recipient
 */
const sendSingleText = (group, to, message) => {
  const nexmo = new Nexmo(
    {
      apiKey: group.apiKey,
      apiSecret: group.secretKey
    },
    { debug: true }
  );
  nexmo.message.sendSms(group.nexmoNumber, to, message, function(err) {
    if (err) {
      console.log(err);
    }
  });
};

module.exports = sendSingleText;
