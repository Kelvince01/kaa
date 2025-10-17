import { logger } from "@kaa/utils";

/**
 * Base contract error class
 */
export class ContractError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly timestamp: Date;
  readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = "CONTRACT_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "ContractError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date();
    this.details = details;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, ContractError.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): ContractErrorResponse {
    return {
      status: "error",
      message: this.message,
      code: this.errorCode,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
    };
  }
}

/**
 * Contract validation error
 */
export class ContractValidationError extends ContractError {
  readonly field?: string;
  readonly validationErrors?: ValidationError[];

  constructor(
    message: string,
    field?: string,
    validationErrors?: ValidationError[]
  ) {
    super(message, 400, "VALIDATION_ERROR", {
      field,
      validationErrors,
    });
    this.name = "ContractValidationError";
    this.field = field;
    this.validationErrors = validationErrors;

    Object.setPrototypeOf(this, ContractValidationError.prototype);
  }
}

/**
 * Contract not found error
 */
export class ContractNotFoundError extends ContractError {
  constructor(contractId: string) {
    super(
      `Contract with ID ${contractId} not found`,
      404,
      "CONTRACT_NOT_FOUND",
      { contractId }
    );
    this.name = "ContractNotFoundError";

    Object.setPrototypeOf(this, ContractNotFoundError.prototype);
  }
}

/**
 * Contract overlap error
 */
export class ContractOverlapError extends ContractError {
  constructor(unitId?: string, existingContractId?: string) {
    super(
      "A contract already exists for this unit during the specified period",
      409,
      "CONTRACT_OVERLAP",
      { unitId, existingContractId }
    );
    this.name = "ContractOverlapError";

    Object.setPrototypeOf(this, ContractOverlapError.prototype);
  }
}

/**
 * Contract authorization error
 */
export class ContractAuthorizationError extends ContractError {
  constructor(action: string, resourceId?: string) {
    super(`Not authorized to ${action}`, 403, "AUTHORIZATION_ERROR", {
      action,
      resourceId,
    });
    this.name = "ContractAuthorizationError";

    Object.setPrototypeOf(this, ContractAuthorizationError.prototype);
  }
}

/**
 * Contract status error
 */
export class ContractStatusError extends ContractError {
  constructor(currentStatus: string, action: string) {
    super(
      `Cannot ${action} contract in ${currentStatus} status`,
      409,
      "INVALID_STATUS",
      {
        currentStatus,
        action,
      }
    );
    this.name = "ContractStatusError";

    Object.setPrototypeOf(this, ContractStatusError.prototype);
  }
}

/**
 * Contract business rule error
 */
export class ContractBusinessRuleError extends ContractError {
  constructor(rule: string, details?: Record<string, any>) {
    super(`Business rule violation: ${rule}`, 422, "BUSINESS_RULE_ERROR", {
      rule,
      ...details,
    });
    this.name = "ContractBusinessRuleError";

    Object.setPrototypeOf(this, ContractBusinessRuleError.prototype);
  }
}

/**
 * Contract file error
 */
export class ContractFileError extends ContractError {
  constructor(operation: string, fileName?: string, reason?: string) {
    super(
      `File operation failed: ${operation}${fileName ? ` for ${fileName}` : ""}${reason ? ` - ${reason}` : ""}`,
      500,
      "FILE_ERROR",
      { operation, fileName, reason }
    );
    this.name = "ContractFileError";

    Object.setPrototypeOf(this, ContractFileError.prototype);
  }
}

/**
 * Contract PDF generation error
 */
export class ContractPDFError extends ContractError {
  constructor(stage: string, reason?: string) {
    super(
      `PDF generation failed at ${stage}${reason ? `: ${reason}` : ""}`,
      500,
      "PDF_GENERATION_ERROR",
      { stage, reason }
    );
    this.name = "ContractPDFError";

    Object.setPrototypeOf(this, ContractPDFError.prototype);
  }
}

/**
 * Contract database error
 */
export class ContractDatabaseError extends ContractError {
  constructor(operation: string, reason?: string) {
    super(
      `Database operation failed: ${operation}${reason ? ` - ${reason}` : ""}`,
      500,
      "DATABASE_ERROR",
      { operation, reason }
    );
    this.name = "ContractDatabaseError";

    Object.setPrototypeOf(this, ContractDatabaseError.prototype);
  }
}

/**
 * Contract external service error
 */
export class ContractExternalServiceError extends ContractError {
  constructor(service: string, operation: string, reason?: string) {
    super(
      `External service error: ${service} - ${operation}${reason ? ` - ${reason}` : ""}`,
      502,
      "EXTERNAL_SERVICE_ERROR",
      { service, operation, reason }
    );
    this.name = "ContractExternalServiceError";

    Object.setPrototypeOf(this, ContractExternalServiceError.prototype);
  }
}

/**
 * Type definitions
 */
export type ValidationError = {
  field: string;
  message: string;
  code: string;
  value?: any;
};

export type ContractErrorResponse = {
  status: "error";
  message: string;
  code: string;
  timestamp: string;
  details?: Record<string, any>;
};

export type ErrorContext = {
  contractId?: string;
  userId?: string;
  action?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  additionalData?: Record<string, any>;
};

/**
 * Error handling utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ContractErrorHandler {
  /**
   * Handle and format contract errors
   */
  static handleError(
    error: Error,
    context?: ErrorContext
  ): ContractErrorResponse {
    // Log the error
    ContractErrorHandler.logError(error, context);

    // Handle known contract errors
    if (error instanceof ContractError) {
      return error.toJSON();
    }

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      return ContractErrorHandler.handleMongoValidationError(error as any);
    }

    // Handle MongoDB cast errors
    if (error.name === "CastError") {
      return ContractErrorHandler.handleMongoCastError(error as any);
    }

    // Handle MongoDB duplicate key errors
    if (error.name === "MongoServerError" && (error as any).code === 11_000) {
      return ContractErrorHandler.handleMongoDuplicateError(error as any);
    }

    // Handle generic errors
    return ContractErrorHandler.handleGenericError(error);
  }

  /**
   * Log error with context
   */
  private static logError(error: Error, context?: ErrorContext): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error instanceof ContractError ? error.statusCode : 500,
      errorCode:
        error instanceof ContractError ? error.errorCode : "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (error instanceof ContractError && error.statusCode < 500) {
      logger.warn("Contract operation failed", errorInfo);
    } else {
      logger.error("Contract operation error", errorInfo);
    }
  }

  /**
   * Handle MongoDB validation errors
   */
  private static handleMongoValidationError(error: any): ContractErrorResponse {
    const validationErrors: ValidationError[] = [];

    if (error.errors) {
      // biome-ignore lint/suspicious/useGuardForIn: ignore
      for (const field in error.errors) {
        const fieldError = error.errors[field];
        validationErrors.push({
          field,
          message: fieldError.message,
          code: fieldError.kind || "VALIDATION_ERROR",
          value: fieldError.value,
        });
      }
    }

    return {
      status: "error",
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
      details: { validationErrors },
    };
  }

  /**
   * Handle MongoDB cast errors
   */
  private static handleMongoCastError(error: any): ContractErrorResponse {
    const field = error.path;
    const value = error.value;
    const expectedType = error.kind;

    return {
      status: "error",
      message: `Invalid ${field}: expected ${expectedType}`,
      code: "INVALID_FORMAT",
      timestamp: new Date().toISOString(),
      details: { field, value, expectedType },
    };
  }

  /**
   * Handle MongoDB duplicate key errors
   */
  private static handleMongoDuplicateError(error: any): ContractErrorResponse {
    const keyValue = error.keyValue;
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field as keyof typeof keyValue];

    return {
      status: "error",
      message: `Duplicate value for ${field}`,
      code: "DUPLICATE_ERROR",
      timestamp: new Date().toISOString(),
      details: { field, value },
    };
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: Error): ContractErrorResponse {
    return {
      status: "error",
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
      details: {
        originalError: error.message,
      },
    };
  }

  /**
   * Create validation error from field errors
   */
  static createValidationError(
    message: string,
    field?: string,
    validationErrors?: ValidationError[]
  ): ContractValidationError {
    return new ContractValidationError(message, field, validationErrors);
  }

  /**
   * Check if error is a client error (4xx)
   */
  static isClientError(error: Error): boolean {
    return (
      error instanceof ContractError &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    );
  }

  /**
   * Check if error is a server error (5xx)
   */
  static isServerError(error: Error): boolean {
    return !(error instanceof ContractError) || error.statusCode >= 500;
  }

  /**
   * Get HTTP status code from error
   */
  static getStatusCode(error: Error): number {
    if (error instanceof ContractError) {
      return error.statusCode;
    }

    // Default status codes for common errors
    switch (error.name) {
      case "ValidationError":
        return 400;
      case "CastError":
        return 400;
      case "MongoServerError":
        return 409;
      default:
        return 500;
    }
  }
}

/**
 * Error factory functions
 */
export const ContractErrors = {
  /**
   * Create validation error
   */
  validation: (
    message: string,
    field?: string,
    validationErrors?: ValidationError[]
  ) => new ContractValidationError(message, field, validationErrors),

  /**
   * Create not found error
   */
  notFound: (contractId: string) => new ContractNotFoundError(contractId),

  /**
   * Create overlap error
   */
  overlap: (unitId?: string, existingContractId?: string) =>
    new ContractOverlapError(unitId, existingContractId),

  /**
   * Create authorization error
   */
  authorization: (action: string, resourceId?: string) =>
    new ContractAuthorizationError(action, resourceId),

  /**
   * Create status error
   */
  status: (currentStatus: string, action: string) =>
    new ContractStatusError(currentStatus, action),

  /**
   * Create business rule error
   */
  businessRule: (rule: string, details?: Record<string, any>) =>
    new ContractBusinessRuleError(rule, details),

  /**
   * Create file error
   */
  file: (operation: string, fileName?: string, reason?: string) =>
    new ContractFileError(operation, fileName, reason),

  /**
   * Create PDF error
   */
  pdf: (stage: string, reason?: string) => new ContractPDFError(stage, reason),

  /**
   * Create database error
   */
  database: (operation: string, reason?: string) =>
    new ContractDatabaseError(operation, reason),

  /**
   * Create external service error
   */
  externalService: (service: string, operation: string, reason?: string) =>
    new ContractExternalServiceError(service, operation, reason),

  /**
   * Create generic error
   */
  generic: (
    message: string,
    statusCode?: number,
    errorCode?: string,
    details?: Record<string, any>
  ) => new ContractError(message, statusCode, errorCode, details),
};

/**
 * Error middleware for HTTP responses
 */
export function handleContractError(error: Error, context?: ErrorContext) {
  const errorResponse = ContractErrorHandler.handleError(error, context);
  const statusCode = ContractErrorHandler.getStatusCode(error);

  return {
    status: statusCode,
    body: errorResponse,
  };
}

/**
 * Async error wrapper
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error instanceof ContractError
        ? error
        : new ContractError(
            error instanceof Error ? error.message : "Unknown error",
            500,
            "ASYNC_ERROR"
          );
    }
  };
}

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ValidationError[];
    };

/**
 * Safe validation wrapper
 */
export function validateSafely<T>(
  validator: () => T,
  errorMessage = "Validation failed"
): ValidationResult<T> {
  try {
    const data = validator();
    return { success: true, data };
  } catch (error) {
    const validationErrors: ValidationError[] = [];

    if (error instanceof ContractValidationError && error.validationErrors) {
      validationErrors.push(...error.validationErrors);
    } else {
      validationErrors.push({
        field: "unknown",
        message: error instanceof Error ? error.message : errorMessage,
        code: "VALIDATION_ERROR",
      });
    }

    return { success: false, errors: validationErrors };
  }
}
