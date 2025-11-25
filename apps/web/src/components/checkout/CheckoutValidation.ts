export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    errors: isValid ? [] : ["Bitte gib eine gültige E-Mail-Adresse ein"]
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const isValid = phoneRegex.test(cleanPhone);
  
  return {
    isValid,
    errors: isValid ? [] : ["Bitte gib eine gültige Telefonnummer ein"]
  };
};

export const validatePostalCode = (postalCode: string, country: string): ValidationResult => {
  const patterns: Record<string, RegExp> = {
    DE: /^\d{5}$/,
    AT: /^\d{4}$/,
    CH: /^\d{4}$/,
    FR: /^\d{5}$/,
    IT: /^\d{5}$/,
    ES: /^\d{5}$/,
    NL: /^\d{4}\s?[A-Z]{2}$/,
    BE: /^\d{4}$/,
    DK: /^\d{4}$/,
    SE: /^\d{3}\s?\d{2}$/,
    NO: /^\d{4}$/,
    FI: /^\d{5}$/,
  };
  
  const pattern = patterns[country] || /^\d{5}$/;
  const isValid = pattern.test(postalCode);
  
  return {
    isValid,
    errors: isValid ? [] : [`Bitte gib eine gültige Postleitzahl für ${country} ein`]
  };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const isValid = value.trim().length > 0;
  
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} ist erforderlich`]
  };
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  const isValid = value.length >= minLength;
  
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} muss mindestens ${minLength} Zeichen lang sein`]
  };
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  const isValid = value.length <= maxLength;
  
  return {
    isValid,
    errors: isValid ? [] : [`${fieldName} darf maximal ${maxLength} Zeichen lang sein`]
  };
};

export const validateAddress = (address: {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  const firstNameResult = validateRequired(address.firstName, "Vorname");
  if (!firstNameResult.isValid) errors.push(...firstNameResult.errors);
  
  const lastNameResult = validateRequired(address.lastName, "Nachname");
  if (!lastNameResult.isValid) errors.push(...lastNameResult.errors);
  
  const address1Result = validateRequired(address.address1, "Straße und Hausnummer");
  if (!address1Result.isValid) errors.push(...address1Result.errors);
  
  const cityResult = validateRequired(address.city, "Stadt");
  if (!cityResult.isValid) errors.push(...cityResult.errors);
  
  const postalCodeResult = validateRequired(address.postalCode, "Postleitzahl");
  if (!postalCodeResult.isValid) errors.push(...postalCodeResult.errors);
  
  // Postal code format validation
  if (address.postalCode) {
    const postalCodeFormatResult = validatePostalCode(address.postalCode, address.country);
    if (!postalCodeFormatResult.isValid) errors.push(...postalCodeFormatResult.errors);
  }
  
  // Phone validation (optional)
  if (address.phone) {
    const phoneResult = validatePhone(address.phone);
    if (!phoneResult.isValid) errors.push(...phoneResult.errors);
  }
  
  // Length validations
  const firstNameLengthResult = validateMaxLength(address.firstName, 50, "Vorname");
  if (!firstNameLengthResult.isValid) errors.push(...firstNameLengthResult.errors);
  
  const lastNameLengthResult = validateMaxLength(address.lastName, 50, "Nachname");
  if (!lastNameLengthResult.isValid) errors.push(...lastNameLengthResult.errors);
  
  const address1LengthResult = validateMaxLength(address.address1, 100, "Straße und Hausnummer");
  if (!address1LengthResult.isValid) errors.push(...address1LengthResult.errors);
  
  const cityLengthResult = validateMaxLength(address.city, 50, "Stadt");
  if (!cityLengthResult.isValid) errors.push(...cityLengthResult.errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

