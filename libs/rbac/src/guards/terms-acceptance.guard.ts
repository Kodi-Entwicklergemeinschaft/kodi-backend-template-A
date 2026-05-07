import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, timeout } from 'rxjs';
import { TERMS_EXEMPT_KEY } from '../decorators/terms-exempt.decorator';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { ConfigService } from '@kodi/config';

@Injectable()
export class TermsAcceptanceGuard implements CanActivate {
  private readonly defaultLocale: string;

  constructor(
    private readonly reflector: Reflector,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly configService: ConfigService,
  ) {
    this.defaultLocale = this.configService.get<string>('terms.defaultLocale', 'en');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is exempt from terms check
    const isExempt = this.reflector.getAllAndOverride<boolean>(TERMS_EXEMPT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isExempt) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Let JWT guard handle authentication
    }

    const userId = user.sub || user.userId;
    if (!userId) {
      return true;
    }

    try {
      // Get locale from request (header, query, or default)
      const locale =
        request.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
        request.query?.locale ||
        this.defaultLocale;

      // Get cityId from user context (selectedCityId or cityId from JWT)
      const cityId = user.selectedCityId || user.cityId || null;

      // Check if user has accepted latest terms via RabbitMQ
      const acceptanceCheck = await firstValueFrom(
        this.client
          .send<
            { hasAccepted: boolean; termsId: string | null; gracePeriodEndsAt: Date | null },
            { userId: string; locale?: string; cityId?: string | null }
          >(RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE, { userId, locale, cityId })
          .pipe(timeout(10000)),
      );

      // If accepted, allow access
      if (acceptanceCheck.hasAccepted) {
        return true;
      }

      // If within grace period, allow access
      if (acceptanceCheck.gracePeriodEndsAt) {
        const gracePeriodEnd = new Date(acceptanceCheck.gracePeriodEndsAt);
        if (new Date() < gracePeriodEnd) {
          return true;
        }
      }

      // Get latest terms to include in error response
      let latestTerms: any = null;
      try {
        latestTerms = await firstValueFrom(
          this.client
            .send<
              any,
              { locale?: string; cityId?: string | null }
            >(RabbitMQPatterns.TERMS_GET_LATEST, { locale, cityId })
            .pipe(timeout(5000)),
        );
      } catch (error) {
        // If we can't get terms, still block access but with minimal info
      }

      // Block access - user must accept terms
      throw new ForbiddenException({
        code: 'TERMS_NOT_ACCEPTED',
        message: 'You must accept the terms of use to continue',
        termsId: latestTerms?.id || acceptanceCheck.termsId,
        version: latestTerms?.version || null,
      });
    } catch (error) {
      // If error is already a ForbiddenException, re-throw it
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // For other errors (e.g., RabbitMQ timeout), log and allow access
      // This prevents the guard from breaking the app if terms service is unavailable
      // In production, you might want to be more strict
      console.warn('Terms acceptance check failed, allowing access:', error);
      return true;
    }
  }
}
