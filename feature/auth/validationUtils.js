// validationUtils.js - Common validation utilities for auth forms

export const ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters long'
  },
  phone: {
    required: true,
    minLength: 10,
    pattern: /^\d{10,}$/,
    message: 'Please enter a valid phone number'
  },
  firstName: {
    required: true,
    minLength: 2,
    message: 'Name must be at least 2 characters long'
  },
  confirmPassword: {
    required: true,
    matchField: 'password',
    message: 'Passwords do not match'
  }
};

export const validateField = (fieldName, value, formData = {}) => {
  const rules = ValidationRules[fieldName];
  if (!rules) return { isValid: true, message: '' };

  // Check required
  if (rules.required && (!value || value.trim() === '')) {
    return { isValid: false, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` };
  }

  // Check minimum length
  if (rules.minLength && value.length < rules.minLength) {
    return { isValid: false, message: rules.message };
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, message: rules.message };
  }

  // Check matching field (for confirm password)
  if (rules.matchField && formData[rules.matchField] !== value) {
    return { isValid: false, message: rules.message };
  }

  return { isValid: true, message: '' };
};

export const validateForm = (formData, userType) => {
  const errors = {};

  // Validate all fields
  Object.keys(formData).forEach(field => {
    const result = validateField(field, formData[field], formData);
    if (!result.isValid) {
      errors[field] = result.message;
    }
  });

  // Additional validation for doctor occupation
  if (userType === 'doctor' && !formData.occupation) {
    errors.occupation = 'Please select your medical occupation';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
