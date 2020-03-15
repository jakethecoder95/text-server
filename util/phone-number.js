exports.validateUSPhoneNumber = num =>
  /^(1?\s?(\d{3}|\(\d{3}\)))[-?|\s?]?\d{3}[-?|\s?]?\d{4}$/.test(num);

exports.sanitizeUSPhoneNumber = num => {
  num = num.replace(/\D/g, "");
  if (num.length === 10) {
    num = "1" + num;
  }
  return num;
};
