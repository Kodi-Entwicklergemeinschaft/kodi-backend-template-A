import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import {
  SendVerificationDto,
  VerifyTokenDto,
  ResendVerificationDto,
  CancelVerificationDto,
  VerifyTokenResponseDto,
  SendVerificationResponseDto,
  CancelVerificationResponseDto,
  VerificationNotFoundErrorResponseDto,
  VerificationBadRequestErrorResponseDto,
  VerificationExpiredErrorResponseDto,
} from '@kodi/contracts';
import { GetLanguage, I18nService } from '@kodi/i18n';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly i18nService: I18nService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send email verification link',
    description:
      'Send a verification email to the user. The email contains a secure verification link that expires in 24 hours. This endpoint is typically called automatically after user registration.',
  })
  @ApiBody({
    type: SendVerificationDto,
    examples: {
      emailVerification: {
        summary: 'Send email verification',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'EMAIL',
          identifier: 'user@example.com',
          metadata: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    type: SendVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid email format or unsupported verification type',
    type: VerificationBadRequestErrorResponseDto,
  })
  async sendVerification(@Body() dto: SendVerificationDto, @GetLanguage() language: string) {
    return this.verificationService.sendVerification(dto, language);
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify email using token from link (GET)',
    description:
      'Verify email address using the token from the verification link. This endpoint is typically accessed when the user clicks the verification link in their email. The token is valid for 24 hours and can only be used once.',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Verification token from the email link',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - token already used or cancelled',
    type: VerificationBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid verification token',
    type: VerificationNotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Verification link has expired',
    type: VerificationExpiredErrorResponseDto,
  })
  async verifyTokenGet(
    @Query('token') token: string,
    @GetLanguage() language: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.verificationService.verifyToken({ token }, language);

      // Use the language from verification metadata (stored during registration)
      const effectiveLanguage = result.language || language;

      // Get translated messages - use specific keys for each text element
      const title =
        this.i18nService.translate('success.EMAIL_VERIFIED_TITLE', undefined, effectiveLanguage) ||
        'Email Verified!';
      const message =
        this.i18nService.translate(
          'success.EMAIL_VERIFIED_MESSAGE',
          undefined,
          effectiveLanguage,
        ) || 'Your email has been verified successfully!';
      const subtitle =
        this.i18nService.translate(
          'success.EMAIL_VERIFIED_SUBTITLE',
          undefined,
          effectiveLanguage,
        ) || 'You can now close this window and continue using the app.';

      // Return HTML page
      const html = this.generateSuccessHtml(title, message, subtitle);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      // Handle errors and show error HTML page - translate the title
      const title =
        this.i18nService.translate('success.VERIFICATION_FAILED', undefined, language) ||
        'Verification Failed';
      const message =
        error.response?.message || error.message || 'An error occurred during verification';
      const errorCode = error.response?.errorCode || 'UNKNOWN_ERROR';

      const html = this.generateErrorHtml(title, message, errorCode);
      res.status(error.status || 500);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email using token (POST)',
    description:
      'Verify email address using the verification token. This endpoint accepts the token in the request body. The token is valid for 24 hours and can only be used once.',
  })
  @ApiBody({
    type: VerifyTokenDto,
    examples: {
      verifyEmail: {
        summary: 'Verify email with token',
        value: {
          token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - token already used or cancelled',
    type: VerificationBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid verification token',
    type: VerificationNotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Verification link has expired',
    type: VerificationExpiredErrorResponseDto,
  })
  async verifyTokenPost(@Body() dto: VerifyTokenDto, @GetLanguage() language: string) {
    return this.verificationService.verifyToken(dto, language);
  }

  @Get('cancel')
  @ApiOperation({
    summary: "Cancel verification (It's not me) - GET",
    description:
      'Cancel a verification request if the user did not initiate it. This endpoint is typically accessed from the "It\'s not me" link in the verification email.',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Verification token to cancel',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification cancelled successfully',
    type: CancelVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot cancel already verified token',
    type: VerificationBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid verification token',
    type: VerificationNotFoundErrorResponseDto,
  })
  async cancelVerificationGet(
    @Query('token') token: string,
    @GetLanguage() language: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.verificationService.cancelVerification({ token }, language);

      // Use the language from verification metadata (stored during registration)
      const effectiveLanguage = result.language || language;

      // Get translated messages
      const title =
        this.i18nService.translate(
          'success.VERIFICATION_CANCELLED',
          undefined,
          effectiveLanguage,
        ) || 'Verification Cancelled';
      const message = result.message || 'The verification request has been cancelled successfully.';
      const subtitle =
        this.i18nService.translate(
          'success.VERIFICATION_CANCELLED_SUBTITLE',
          undefined,
          effectiveLanguage,
        ) ||
        'If you did not request this verification, your account remains secure. You can safely close this window.';

      // Return HTML page
      const html = this.generateCancellationHtml(title, message, subtitle);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      // Handle errors and show error HTML page
      const title =
        this.i18nService.translate('success.VERIFICATION_FAILED', undefined, language) ||
        'Cancellation Failed';
      const message =
        error.response?.message || error.message || 'An error occurred during cancellation';
      const errorCode = error.response?.errorCode || 'UNKNOWN_ERROR';

      const html = this.generateErrorHtml(title, message, errorCode);
      res.status(error.status || 500);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    }
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel verification (POST)',
    description:
      'Cancel a verification request if the user did not initiate it. This endpoint accepts the token in the request body.',
  })
  @ApiBody({
    type: CancelVerificationDto,
    examples: {
      cancelVerification: {
        summary: 'Cancel verification',
        value: {
          token: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification cancelled successfully',
    type: CancelVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot cancel already verified token',
    type: VerificationBadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid verification token',
    type: VerificationNotFoundErrorResponseDto,
  })
  async cancelVerificationPost(
    @Body() dto: CancelVerificationDto,
    @GetLanguage() language: string,
  ) {
    return this.verificationService.cancelVerification(dto, language);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Resend a verification email if the previous one expired or was not received. A new verification link will be sent with a fresh 24-hour expiration.',
  })
  @ApiBody({
    type: ResendVerificationDto,
    examples: {
      resendEmail: {
        summary: 'Resend email verification',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          type: 'EMAIL',
          identifier: 'user@example.com',
          metadata: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
    type: SendVerificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - verification email already sent and not expired',
    type: VerificationBadRequestErrorResponseDto,
  })
  async resendVerification(@Body() dto: ResendVerificationDto, @GetLanguage() language: string) {
    return this.verificationService.resendVerification(dto, language);
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Get verification status' })
  @ApiQuery({ name: 'type', enum: ['EMAIL', 'SMS'], required: true })
  async getStatus(@Param('userId') userId: string, @Query('type') type: 'EMAIL' | 'SMS') {
    return this.verificationService.getVerificationStatus(userId, type);
  }

  private generateSuccessHtml(title: string, message: string, subtitle: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
          }
          @keyframes scaleIn {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }
          .success-icon svg {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          h1 {
            color: #1a202c;
            font-size: 32px;
            margin-bottom: 16px;
            font-weight: 700;
          }
          p {
            color: #4a5568;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .subtitle {
            color: #718096;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">
            <svg viewBox="0 0 52 52">
              <path d="M14 27l9 9 17-17"/>
            </svg>
          </div>
          <h1>${title}</h1>
          <p>${message}</p>
          <p class="subtitle">${subtitle}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateErrorHtml(title: string, message: string, errorCode: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .error-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
          }
          @keyframes scaleIn {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }
          .error-icon svg {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          h1 {
            color: #1a202c;
            font-size: 32px;
            margin-bottom: 16px;
            font-weight: 700;
          }
          p {
            color: #4a5568;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .error-code {
            color: #a0aec0;
            font-size: 12px;
            margin-top: 20px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">
            <svg viewBox="0 0 52 52">
              <line x1="16" y1="16" x2="36" y2="36"/>
              <line x1="36" y1="16" x2="16" y2="36"/>
            </svg>
          </div>
          <h1>${title}</h1>
          <p>${message}</p>
          <p class="error-code">Error Code: ${errorCode}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateCancellationHtml(title: string, message: string, subtitle: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f6ad55 0%, #fc8181 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 60px 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .cancel-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #f6ad55 0%, #fc8181 100%);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
          }
          @keyframes scaleIn {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }
          .cancel-icon svg {
            width: 50px;
            height: 50px;
            stroke: white;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
          }
          h1 {
            color: #1a202c;
            font-size: 32px;
            margin-bottom: 16px;
            font-weight: 700;
          }
          p {
            color: #4a5568;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
          .subtitle {
            color: #718096;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="cancel-icon">
            <svg viewBox="0 0 52 52">
              <line x1="16" y1="16" x2="36" y2="36"/>
              <line x1="36" y1="16" x2="16" y2="36"/>
            </svg>
          </div>
          <h1>${title}</h1>
          <p>${message}</p>
          <p class="subtitle">${subtitle}</p>
        </div>
      </body>
      </html>
    `;
  }
}
