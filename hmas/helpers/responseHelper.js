module.exports.sendResponse = (
  res,
  success,
  message,
  data = null,
  statusCode = 200
) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};
