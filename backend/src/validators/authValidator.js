import { body } from 'express-validator';

// Register validation
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 150 })
    .withMessage('Name must not exceed 150 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+?88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('nid')
    .trim()
    .notEmpty()
    .withMessage('NID is required')
    .isLength({ min: 10, max: 17 })
    .withMessage('NID must be between 10 and 17 characters'),
  
  body('epin')
    .trim()
    .notEmpty()
    .withMessage('ePin is required')
    .isLength({ min: 5, max: 5 })
    .withMessage('ePin must be exactly 5 digits')
    .isNumeric()
    .withMessage('ePin must contain only numbers'),
  
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['user', 'agent', 'admin'])
    .withMessage('Role must be user, agent, or admin')
];

// Login validation
export const loginValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^(\+?88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
  
  body('epin')
    .trim()
    .notEmpty()
    .withMessage('ePin is required')
    .isLength({ min: 5, max: 5 })
    .withMessage('ePin must be exactly 5 digits')
    .isNumeric()
    .withMessage('ePin must contain only numbers')
];
