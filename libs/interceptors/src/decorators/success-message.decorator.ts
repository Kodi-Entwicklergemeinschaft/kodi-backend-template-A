import { SetMetadata } from '@nestjs/common';

export const SUCCESS_MESSAGE_KEY = 'successMessage';

/**
 * Decorator to explicitly specify a success message key for a route
 * This overrides the default route-to-message-key mapping in SuccessMessageService
 *
 * @param messageKey The success message key (e.g., 'USER_REGISTERED', 'LOGIN_SUCCESS')
 *
 * @example
 * ```typescript
 * @Post('register')
 * @SuccessMessage('USER_REGISTERED')
 * async register(@Body() dto: RegisterDto) {
 *   return this.usersService.register(dto);
 * }
 * ```
 */
export const SuccessMessage = (messageKey: string) => SetMetadata(SUCCESS_MESSAGE_KEY, messageKey);
