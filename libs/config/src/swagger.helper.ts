import { ConfigService } from './config.service';

/**
 * Get the Swagger server URL based on environment configuration
 * Returns empty string for local development, or API gateway path for server/production
 */
export function getSwaggerServerUrl(configService: ConfigService, serviceName: string): string {
  const enableApiGatewayPrefix = configService.get<boolean>('enableApiGatewayPrefix', false);
  const apiPrefix = configService.get<string>('apiPrefix', 'api');

  if (enableApiGatewayPrefix) {
    return `/${apiPrefix}/${serviceName}`;
  }

  // For local development, return empty string (no prefix)
  return '';
}
