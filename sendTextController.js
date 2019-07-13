const Nexmo = require("nexmo");

module.exports.sendTexts = (req, res, next) => {
  const nexmo = new Nexmo(
    {
      apiKey: req.body.apiKey,
      apiSecret: req.body.secretKey
    },
    { debug: true }
  );
  const numbers = req.body.numbers;
  const message = req.body.message;
  const nexmoNumber = req.body.nexmoNumber;

  numbers.forEach(number =>
    nexmo.message.sendSms(
      nexmoNumber,
      number,
      message,
      { type: "unicode" },
      (err, responseData) => {
        if (err) {
          console.log(err);
        } else {
          console.dir(responseData);
        }
      }
    )
  );

  res.status(200).json({ message: "success!" });
};
