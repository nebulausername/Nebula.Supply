// 🚀 Input Validation Utilities für Security

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// 🎯 Validate Cookie Clicker Stats
export const validateCookieStats = (stats: any): ValidationResult => {
  const errors: string[] = [];

  if (typeof stats.totalCookies !== 'number' || stats.totalCookies < 0) {
    errors.push('totalCookies must be a non-negative number');
  }
  if (stats.totalCookies > Number.MAX_SAFE_INTEGER) {
    errors.push('totalCookies exceeds maximum safe integer');
  }

  if (typeof stats.cookiesPerSecond !== 'number' || stats.cookiesPerSecond < 0) {
    errors.push('cookiesPerSecond must be a non-negative number');
  }
  if (stats.cookiesPerSecond > 1000000) { // Reasonable max CPS
    errors.push('cookiesPerSecond exceeds reasonable maximum');
  }

  if (typeof stats.timePlayed !== 'number' || stats.timePlayed < 0) {
    errors.push('timePlayed must be a non-negative number');
  }
  if (stats.timePlayed > 31536000000) { // ~1000 years in seconds
    errors.push('timePlayed exceeds reasonable maximum');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// 🎯 Validate Nickname
export const validateNickname = (nickname: string): ValidationResult => {
  const errors: string[] = [];

  if (typeof nickname !== 'string') {
    errors.push('Nickname must be a string');
    return { valid: false, errors };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 3 || trimmed.length > 20) {
    errors.push('Nickname must be between 3 and 20 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    errors.push('Nickname can only contain letters, numbers, underscores, and hyphens');
  }

  // Check for potentially harmful patterns
  if (/<script|javascript:|on\w+=/i.test(trimmed)) {
    errors.push('Nickname contains potentially harmful content');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// 🎯 Sanitize String Input
export const sanitizeString = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);

  // Remove potentially harmful characters
  sanitized = sanitized.replace(/[<>]/g, '');

  return sanitized;
};

// 🎯 Validate Number Range
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult => {
  const errors: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
  } else {
    if (value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }
    if (value > max) {
      errors.push(`${fieldName} must be at most ${max}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

