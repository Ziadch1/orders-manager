function errorHandler(err, req, res, next) {
  console.error('API error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: 'Internal Server Error',
    message: err.message || 'Unexpected error',
  });
}

module.exports = errorHandler;
