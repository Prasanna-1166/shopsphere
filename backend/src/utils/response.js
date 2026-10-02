/**
 * Standardized API Response Utilities
 */

const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
  };
  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'Something went wrong', errors = [], statusCode = 500) => {
  const formattedErrors = Array.isArray(errors) ? errors : [errors];
  const response = {
    success: false,
    message,
    errors: formattedErrors,
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
