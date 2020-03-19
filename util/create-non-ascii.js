module.exports = str =>
  str
    .replace("“", '"')
    .replace("”", '"')
    .replace("’", "'")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
