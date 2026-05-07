import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CityContextService } from './city-context.service';

@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  constructor(private readonly cityContextService: CityContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JWT guard

    // Initialize context
    const cityContext: { cityId?: string; cityIds?: string[] } = {};

    if (user) {
      // Set city IDs from JWT payload (set by JWT strategy)
      if (user.cityIds && Array.isArray(user.cityIds)) {
        cityContext.cityIds = user.cityIds;
      }

      // Set current city ID from query param, header, or JWT
      const cityId = request.query?.cityId || request.headers?.['x-city-id'] || user.cityId;

      if (cityId) {
        cityContext.cityId = cityId;
      }
    }

    // Run the request handler within the city context
    return new Observable((subscriber) => {
      this.cityContextService.run(cityContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
