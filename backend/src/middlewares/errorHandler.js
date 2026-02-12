import { errorResponse } from '../utils/response.js';

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // PostgreSQL unique constraint error
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.*?)\)/)?.[1] || 'field';
    return errorResponse(res, `${field} already exists`, 400);
  }

  // PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced record does not exist', 400);
  }

  // PostgreSQL check constraint error
  if (err.code === '23514') {
    return errorResponse(res, 'Invalid data provided', 400);
  }

  // Default error
  return errorResponse(
    res,
    err.message || 'Internal Server Error',
    err.statusCode || 500
  );
};

// 404 handler
export const notFound = (req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};
