export interface IVerificationStrategy {
  /**
   * Generate a verification token/code
   */
  generateToken(): string;

  /**
   * Send verification code to user
   */
  sendVerification(
    identifier: string, // email or phone
    token: string,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Validate the identifier format (email format, phone format, etc.)
   */
  validateIdentifier(identifier: string): boolean;

  /**
   * Get the verification type this strategy handles
   */
  getType(): 'EMAIL' | 'SMS';
}
