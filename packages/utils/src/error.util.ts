/**
 * Custom error classes for consistent error handling
 */

import { StatusCodes } from "http-status-codes";

/**
 * Base application error class
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class BadRequestError extends AppError {
  readonly status: number;

  constructor(message = "Bad Request") {
    super(message, StatusCodes.BAD_REQUEST);

    this.status = StatusCodes.BAD_REQUEST;
  }
}

export class ConflictError extends AppError {
  readonly status: number;

  constructor(message: string) {
    super(message, StatusCodes.CONFLICT);

    this.status = StatusCodes.CONFLICT;
  }
}

export class MongoServerError extends AppError {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "MongoServerError";
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  readonly status: number;

  constructor(message = "Unauthorized") {
    super(message, StatusCodes.UNAUTHORIZED);

    this.status = StatusCodes.UNAUTHORIZED;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, StatusCodes.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too Many Requests") {
    super(message, StatusCodes.TOO_MANY_REQUESTS);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, false);
  }
}
