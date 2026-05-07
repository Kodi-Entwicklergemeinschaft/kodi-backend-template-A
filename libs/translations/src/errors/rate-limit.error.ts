/**
 * Custom error class for rate limit errors from translation APIs
 */
export class RateLimitError extends Error {
  public readonly statusCode: number;
  public readonly retryAfter?: number;
  public readonly retryCount: number;
  public readonly originalError?: any;

  constructor(
    message: string,
    statusCode: number = 429,
    retryAfter?: number,
    retryCount: number = 0,
    originalError?: any,
  ) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
    this.retryCount = retryCount;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RateLimitError);
    }
  }
}
