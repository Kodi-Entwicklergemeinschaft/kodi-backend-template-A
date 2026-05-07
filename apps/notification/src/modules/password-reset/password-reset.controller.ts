import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { GetLanguage } from '@kodi/i18n';

@ApiTags('Password Reset')
@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Get('verify')
  @ApiOperation({
    summary: 'Verify password reset token (GET)',
    description: 'Verify if a password reset token is valid',
  })
  @ApiQuery({
    name: 'token',
    type: String,
    description: 'Password reset token from the email link',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - token already used or cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid password reset token',
  })
  @ApiResponse({
    status: 422,
    description: 'Password reset link has expired',
  })
  async verifyTokenGet(@Query('token') token: string, @GetLanguage() language: string) {
    return this.passwordResetService.verifyResetToken(token, language);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify password reset token (POST)',
    description: 'Verify if a password reset token is valid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  async verifyTokenPost(@Body() body: { token: string }, @GetLanguage() language: string) {
    return this.passwordResetService.verifyResetToken(body.token, language);
  }
}
