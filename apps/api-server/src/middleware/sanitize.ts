import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';

/**
 * Sanitize string inputs to prevent XSS attacks
 */
export const sanitizeString = (value: string): string => {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  // Remove HTML tags and encode special characters
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Max length protection
};

/**
 * Sanitize email addresses
 */
export const sanitizeEmail = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Basic email sanitization - remove dangerous characters
  return value
    .toLowerCase()
    .replace(/[<>\"'%;()&+]/g, '')
    .trim()
    .slice(0, 254); // Max email length
};

/**
 * Sanitize phone numbers
 */
export const sanitizePhone = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Only allow digits, spaces, +, -, (, )
  return value
    .replace(/[^\d\s+\-()]/g, '')
    .trim()
    .slice(0, 20); // Max phone length
};

/**
 * Sanitize address fields
 */
export const sanitizeAddress = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Allow alphanumeric, spaces, common address characters
  return value
    .replace(/[<>\"'%;()&+]/g, '')
    .trim()
    .slice(0, 200); // Max address length
};

/**
 * Sanitize postal code
 */
export const sanitizePostalCode = (value: string): string => {
  if (typeof value !== 'string') {
    return '';
  }
  
  // Only allow alphanumeric and spaces
  return value
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .slice(0, 10); // Max postal code length
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    // Sanitize string fields in body
    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            // Apply appropriate sanitization based on field name
            if (key.toLowerCase().includes('email')) {
              sanitized[key] = sanitizeEmail(value);
            } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('tel')) {
              sanitized[key] = sanitizePhone(value);
            } else if (key.toLowerCase().includes('address') || key.toLowerCase().includes('street') || key.toLowerCase().includes('city')) {
              sanitized[key] = sanitizeAddress(value);
            } else if (key.toLowerCase().includes('postal') || key.toLowerCase().includes('zip')) {
              sanitized[key] = sanitizePostalCode(value);
            } else {
              sanitized[key] = sanitizeString(value);
            }
          } else {
            sanitized[key] = sanitizeObject(value);
          }
        }
        return sanitized;
      }
      
      return obj;
    };
    
    req.body = sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Express-validator chains for common validations
 */
export const addressValidation = [
  body('firstName').isString().trim().isLength({ min: 1, max: 50 }).customSanitizer(sanitizeString),
  body('lastName').isString().trim().isLength({ min: 1, max: 50 }).customSanitizer(sanitizeString),
  body('address1').isString().trim().isLength({ min: 1, max: 200 }).customSanitizer(sanitizeAddress),
  body('address2').optional().isString().trim().isLength({ max: 200 }).customSanitizer(sanitizeAddress),
  body('city').isString().trim().isLength({ min: 1, max: 50 }).customSanitizer(sanitizeString),
  body('postalCode').isString().trim().isLength({ min: 1, max: 10 }).customSanitizer(sanitizePostalCode),
  body('country').isString().trim().isLength({ min: 2, max: 2 }).isUppercase(),
  body('phone').optional().isString().trim().isLength({ max: 20 }).customSanitizer(sanitizePhone),
  body('company').optional().isString().trim().isLength({ max: 100 }).customSanitizer(sanitizeString),
];

export const checkoutItemValidation = [
  body('items').isArray({ min: 1 }),
  body('items.*.id').isString().trim().isLength({ min: 1, max: 100 }).customSanitizer(sanitizeString),
  body('items.*.name').isString().trim().isLength({ min: 1, max: 200 }).customSanitizer(sanitizeString),
  body('items.*.variant').isString().trim().isLength({ min: 1, max: 100 }).customSanitizer(sanitizeString),
  body('items.*.price').isNumeric().isFloat({ min: 0, max: 1000000 }),
  body('items.*.quantity').isInt({ min: 1, max: 100 }),
];

