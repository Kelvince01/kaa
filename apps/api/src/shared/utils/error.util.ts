// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_BANNED: "ACCOUNT_BANNED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  PHONE_NOT_VERIFIED: "PHONE_NOT_VERIFIED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_LENGTH: "INVALID_LENGTH",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_RANGE: "INVALID_RANGE",

  // Resources
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  RESOURCE_DELETED: "RESOURCE_DELETED",

  // Users
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  PHONE_ALREADY_EXISTS: "PHONE_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  INVALID_USER_ROLE: "INVALID_USER_ROLE",

  // Properties
  PROPERTY_NOT_FOUND: "PROPERTY_NOT_FOUND",
  PROPERTY_NOT_AVAILABLE: "PROPERTY_NOT_AVAILABLE",
  PROPERTY_ALREADY_RENTED: "PROPERTY_ALREADY_RENTED",
  INVALID_PROPERTY_TYPE: "INVALID_PROPERTY_TYPE",
  INVALID_LOCATION: "INVALID_LOCATION",

  // Payments
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_CANCELLED: "PAYMENT_CANCELLED",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  INVALID_PAYMENT_METHOD: "INVALID_PAYMENT_METHOD",
  MPESA_ERROR: "MPESA_ERROR",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",

  // Applications
  APPLICATION_NOT_FOUND: "APPLICATION_NOT_FOUND",
  APPLICATION_ALREADY_EXISTS: "APPLICATION_ALREADY_EXISTS",
  APPLICATION_ALREADY_SUBMITTED: "APPLICATION_ALREADY_SUBMITTED",
  INVALID_APPLICATION_STATUS: "INVALID_APPLICATION_STATUS",

  // Files
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",

  // External Services
  SMS_DELIVERY_FAILED: "SMS_DELIVERY_FAILED",
  EMAIL_DELIVERY_FAILED: "EMAIL_DELIVERY_FAILED",
  GEOCODING_FAILED: "GEOCODING_FAILED",

  // System
  DATABASE_ERROR: "DATABASE_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Kenyan Specific
  INVALID_KENYAN_PHONE: "INVALID_KENYAN_PHONE",
  INVALID_NATIONAL_ID: "INVALID_NATIONAL_ID",
  INVALID_COUNTY: "INVALID_COUNTY",
  MPESA_TRANSACTION_FAILED: "MPESA_TRANSACTION_FAILED",
} as const;

// Error Messages (English and Swahili)
export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: {
    en: "Invalid email or password",
    sw: "Barua pepe au nenosiri si sahihi",
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    en: "Your session has expired. Please log in again",
    sw: "Kipindi chako kimemalizika. Tafadhali ingia tena",
  },
  [ERROR_CODES.TOKEN_INVALID]: {
    en: "Invalid authentication token",
    sw: "Tokeni ya uthibitisho si sahihi",
  },
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: {
    en: "You do not have permission to perform this action",
    sw: "Huna ruhusa ya kufanya kitendo hiki",
  },
  [ERROR_CODES.ACCOUNT_SUSPENDED]: {
    en: "Your account has been suspended",
    sw: "Akaunti yako imesimamishwa",
  },
  [ERROR_CODES.ACCOUNT_BANNED]: {
    en: "Your account has been banned",
    sw: "Akaunti yako imezuiliwa",
  },
  [ERROR_CODES.EMAIL_NOT_VERIFIED]: {
    en: "Please verify your email address",
    sw: "Tafadhali thibitisha anwani yako ya barua pepe",
  },
  [ERROR_CODES.PHONE_NOT_VERIFIED]: {
    en: "Please verify your phone number",
    sw: "Tafadhali thibitisha nambari yako ya simu",
  },
  [ERROR_CODES.USER_NOT_FOUND]: {
    en: "User not found",
    sw: "Mtumiaji hajapatikana",
  },
  [ERROR_CODES.USER_ALREADY_EXISTS]: {
    en: "User already exists",
    sw: "Mtumiaji tayari yupo",
  },
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    en: "Email address is already registered",
    sw: "Anwani ya barua pepe tayari imesajiliwa",
  },
  [ERROR_CODES.USERNAME_ALREADY_EXISTS]: {
    en: "Username is already registered",
    sw: "Nambari ya simu tayari imesajiliwa",
  },
  [ERROR_CODES.PHONE_ALREADY_EXISTS]: {
    en: "Phone number is already registered",
    sw: "Nambari ya simu tayari imesajiliwa",
  },
  [ERROR_CODES.PROPERTY_NOT_FOUND]: {
    en: "Property not found",
    sw: "Mali haijaopatikana",
  },
  [ERROR_CODES.PROPERTY_NOT_AVAILABLE]: {
    en: "Property is not available for rent",
    sw: "Mali haijaapatikana kwa ukodishaji",
  },
  [ERROR_CODES.PROPERTY_ALREADY_RENTED]: {
    en: "Property is already rented",
    sw: "Mali tayari imekodishwa",
  },
  [ERROR_CODES.PAYMENT_FAILED]: {
    en: "Payment failed. Please try again",
    sw: "Malipo yameshindwa. Tafadhali jaribu tena",
  },
  [ERROR_CODES.INSUFFICIENT_FUNDS]: {
    en: "Insufficient funds",
    sw: "Pesa hazitoshi",
  },
  [ERROR_CODES.MPESA_ERROR]: {
    en: "M-Pesa transaction failed",
    sw: "Muamala wa M-Pesa umeshindwa",
  },
  [ERROR_CODES.FILE_TOO_LARGE]: {
    en: "File size is too large",
    sw: "Ukubwa wa faili ni mkubwa sana",
  },
  [ERROR_CODES.INVALID_FILE_TYPE]: {
    en: "Invalid file type",
    sw: "Aina ya faili si sahihi",
  },
  [ERROR_CODES.INVALID_KENYAN_PHONE]: {
    en: "Invalid Kenyan phone number format",
    sw: "Muundo wa nambari ya simu ya Kenya si sahihi",
  },
  [ERROR_CODES.INVALID_NATIONAL_ID]: {
    en: "Invalid national ID number",
    sw: "Nambari ya kitambulisho cha kitaifa si sahihi",
  },
  [ERROR_CODES.INVALID_COUNTY]: {
    en: "Invalid Kenyan county",
    sw: "Kaunti ya Kenya si sahihi",
  },
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    en: "Too many requests. Please try again later",
    sw: "Maombi mengi sana. Tafadhali jaribu baadaye",
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    en: "Service is currently unavailable. Please try again later",
    sw: "Huduma haijaopatikana kwa sasa. Tafadhali jaribu baadaye",
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: {
    en: "Account created successfully",
    sw: "Akaunti imeundwa kikamilifu",
  },
  USER_LOGIN: {
    en: "Logged in successfully",
    sw: "Umeingia kikamilifu",
  },
  USER_LOGOUT: {
    en: "Logged out successfully",
    sw: "Umetoka kikamilifu",
  },
  PASSWORD_RESET: {
    en: "Password reset successfully",
    sw: "Nenosiri limebadilishwa kikamilifu",
  },
  PROPERTY_CREATED: {
    en: "Property created successfully",
    sw: "Mali imeundwa kikamilifu",
  },
  PROPERTY_UPDATED: {
    en: "Property updated successfully",
    sw: "Mali imesasishwa kikamilifu",
  },
  APPLICATION_SUBMITTED: {
    en: "Application submitted successfully",
    sw: "Maombi yamewasilishwa kikamilifu",
  },
  PAYMENT_SUCCESSFUL: {
    en: "Payment completed successfully",
    sw: "Malipo yamekamilika kikamilifu",
  },
  OTP_SENT: {
    en: "Verification code sent to your phone",
    sw: "Nambari ya uthibitisho imetumwa kwenye simu yako",
  },
  PHONE_VERIFIED: {
    en: "Phone number verified successfully",
    sw: "Nambari ya simu imethibitishwa kikamilifu",
  },
  EMAIL_VERIFIED: {
    en: "Email address verified successfully",
    sw: "Anwani ya barua pepe imethibitishwa kikamilifu",
  },
} as const;

// Get localized message
export function getErrorMessage(
  code: string,
  lang: "en" | "sw" = "en"
): string {
  const message = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];
  return message ? message[lang] : `Unknown error: ${code}`;
}

export function getSuccessMessage(
  code: string,
  lang: "en" | "sw" = "en"
): string {
  const message = SUCCESS_MESSAGES[code as keyof typeof SUCCESS_MESSAGES];
  return message ? message[lang] : `Success: ${code}`;
}
