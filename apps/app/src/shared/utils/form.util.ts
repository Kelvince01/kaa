const VALID_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const AT_LEAST_ONE_LOWERCASE = /[a-z]/;
const AT_LEAST_ONE_UPPERCASE = /[A-Z]/;
const AT_LEAST_ONE_NUMBER = /[0-9]/;
const AT_LEAST_ONE_SPECIAL_CHARACTER = /[^\w\s]/;
const COMMON_PASSWORDS = ["password", "123456", "qwerty", "admin", "letmein"];
const KE_PHONE_REGEX = /^((\+254)|0)[0-9]{9}$/;
const UK_POSTCODE_REGEX = /^[0-9]{5}$/;

// Password strength validation
export function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      text: "",
      color: "",
    };
  }

  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (AT_LEAST_ONE_UPPERCASE.test(password)) score += 1;
  if (AT_LEAST_ONE_LOWERCASE.test(password)) score += 1;
  if (AT_LEAST_ONE_NUMBER.test(password)) score += 1;
  if (AT_LEAST_ONE_SPECIAL_CHARACTER.test(password)) score += 1;

  // Calculate final score (0-4)
  const normalizedScore = Math.min(4, Math.floor(score / 1.5));

  // Determine text and color based on score
  let text = "";
  let color = "";

  switch (normalizedScore) {
    case 0:
      text = "Weak";
      color = "red";
      break;
    case 1:
      text = "Weak";
      color = "red";
      break;
    case 2:
      text = "Medium";
      color = "yellow";
      break;
    case 3:
      text = "Strong";
      color = "green";
      break;
    case 4:
      text = "Very Strong";
      color = "emerald";
      break;
    default:
      text = "";
      color = "";
  }

  return {
    score: normalizedScore,
    text,
    color,
  };
}

// Email validation with proper regex
export const isValidEmail = (email: string): boolean => {
  const emailRegex = VALID_EMAIL;
  return emailRegex.test(email);
};

// Phone number validation (KE format)
export const isValidPhoneKE = (phone: string): boolean => {
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  // Kenya phone numbers typically start with 0 or +254 and are 9-10 digits long
  const phoneRegex = KE_PHONE_REGEX;
  return phoneRegex.test(cleanPhone);
};

// Number range validation
export const isInRange = (
  value: number | string,
  min: number,
  max: number
): boolean => {
  const num = Number(value);
  return !Number.isNaN(num) && num >= min && num <= max;
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(date.getTime()) && date >= today;
};

export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(date.getTime()) && date < today;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (_error) {
    return false;
  }
};

// Postcode validation (UK)
export const isValidPostcodeKE = (postcode: string): boolean => {
  const postcodeRegex = UK_POSTCODE_REGEX;
  return postcodeRegex.test(postcode);
};
