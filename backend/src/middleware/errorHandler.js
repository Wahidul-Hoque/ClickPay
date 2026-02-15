// ==============================================
// ERROR HANDLING MIDDLEWARE
// ==============================================

// ==============================================
// GLOBAL ERROR HANDLER
// ==============================================
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  // PostgreSQL unique constraint error (duplicate phone/NID)
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.*?)\)/)?.[1] || 'field';
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist'
    });
  }

  // PostgreSQL check constraint error
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data provided'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

// ==============================================
// 404 HANDLER - Route Not Found
// ==============================================
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};
