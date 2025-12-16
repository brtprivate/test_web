import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Common validation rules
 */
export const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .trim(),

  // Password validation
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),

  // MongoDB ObjectId validation
  mongoId: (field: string = 'id') =>
    param(field)
      .isMongoId()
      .withMessage(`Invalid ${field} format`),

  // Positive number validation
  positiveNumber: (field: string) =>
    body(field)
      .isFloat({ min: 0 })
      .withMessage(`${field} must be a positive number`),

  // String validation with length
  string: (field: string, minLength: number = 1, maxLength: number = 1000) =>
    body(field)
      .isString()
      .withMessage(`${field} must be a string`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
      .customSanitizer((value) => sanitizeString(value)),

  // Optional string validation
  optionalString: (field: string, maxLength: number = 1000) =>
    body(field)
      .optional()
      .isString()
      .withMessage(`${field} must be a string`)
      .isLength({ max: maxLength })
      .withMessage(`${field} must not exceed ${maxLength} characters`)
      .customSanitizer((value) => (value ? sanitizeString(value) : value)),

  // Enum validation
  enum: (field: string, allowedValues: string[]) =>
    body(field)
      .isIn(allowedValues)
      .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`),

  // Date validation
  date: (field: string) =>
    body(field)
      .optional()
      .isISO8601()
      .withMessage(`${field} must be a valid ISO 8601 date`),

  // Pagination validation
  pagination: {
    page: query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    limit: query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  },
};

/**
 * Admin login validation
 */
export const validateAdminLogin = [
  commonValidations.email,
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  handleValidationErrors,
];

/**
 * User login validation
 */
export const validateUserLogin = [
  body('telegramChatId')
    .notEmpty()
    .withMessage('Telegram Chat ID is required')
    .isNumeric()
    .withMessage('Telegram Chat ID must be a number'),
  handleValidationErrors,
];

/**
 * User signup validation
 */
export const validateUserSignup = [
  body('telegramChatId')
    .notEmpty()
    .withMessage('Telegram Chat ID is required')
    .isNumeric()
    .withMessage('Telegram Chat ID must be a number'),
  body('username')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .customSanitizer((value) => sanitizeString(value)),
  handleValidationErrors,
];

/**
 * Investment creation validation
 */
export const validateInvestment = [
  commonValidations.mongoId('planId'),
  commonValidations.positiveNumber('amount'),
  handleValidationErrors,
];

/**
 * Deposit creation validation
 */
export const validateDeposit = [
  commonValidations.positiveNumber('amount'),
  body('transactionHash')
    .optional()
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Transaction hash must be a valid string'),
  handleValidationErrors,
];

/**
 * Withdrawal creation validation
 */
export const validateWithdrawal = [
  commonValidations.positiveNumber('amount'),
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .isString()
    .isLength({ min: 10, max: 200 })
    .withMessage('Wallet address must be between 10 and 200 characters')
    .customSanitizer((value) => sanitizeString(value)),
  handleValidationErrors,
];

/**
 * Admin user update validation
 */
export const validateAdminUserUpdate = [
  commonValidations.mongoId('id'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('balance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Balance must be a positive number'),
  handleValidationErrors,
];

/**
 * MongoDB ID parameter validation (for URL params)
 */
export const validateMongoIdParam = (paramName: string = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors,
];

