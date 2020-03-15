const csvParser = require("csv-parser");
const fs = require("fs");

const {
  sanitizeUSPhoneNumber,
  validateUSPhoneNumber
} = require("./phone-number");

exports.parseCSVToGroup = (filePath, successCB, errorCB) => {
  newMembers = [];
  fs.createReadStream(filePath)
    .on("error", error => {
      errorCB(error);
    })
    .pipe(csvParser())
    .on("data", row => {
      // Loop through all the key values in the row Object
      for (let el of Object.keys(row)) {
        // If key name has M(m)obile and P(p)hone in it then process that field
        if (/[M|m]obile/.test(el) && /[P|p]hone/.test(el)) {
          // Split numbers up. Numbers can be separated by ";" in Planning Center
          let numbers = [...new Set(row[el].split(";"))];
          for (let i = 0; i < numbers.length; i++) {
            if (!validateUSPhoneNumber(numbers[i])) {
              numbers.splice(i, 1);
              --i;
              continue;
            }
            numbers[i] = sanitizeUSPhoneNumber(numbers[i]);
          }
          // Get the name fields
          const firstName = row["First Name"],
            lastName = row["Last Name"],
            name = firstName
              ? `${firstName} ${lastName ? lastName : ""}`
              : "Undefined";
          // Add a new person for each number there was.
          for (let num of numbers) {
            newMembers.push({ name, number: num });
          }
        }
      }
    })
    .on("end", () => {
      successCB(newMembers);
      fs.unlinkSync(filePath);
    });
};
