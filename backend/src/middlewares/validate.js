import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

// Check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Validation failed',
      400,
      errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    );
  }
  
  next();
};
