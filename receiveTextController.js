module.exports = (req, res, next) => {
  const params = Object.assign(req.query, req.body);
  console.log(params);
  res.status(200).send();
};
