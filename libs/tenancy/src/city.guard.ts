import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CITY_SCOPED_KEY } from './city-scoped.decorator';
import { CityContextService } from './city-context.service';

@Injectable()
export class CityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly cityContextService: CityContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires city scoping
    const isCityScoped = this.reflector.getAllAndOverride<boolean>(CITY_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isCityScoped) {
      return true; // Route doesn't require city context
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin can access all cities
    // Handle both number (1) and string ('SUPER_ADMIN') roles for backward compatibility
    if (user.role === 1 || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Get requested city ID from params, query, or context
    const requestedCityId =
      request.params?.cityId ||
      request.params?.id || // For routes like /cities/:id
      request.query?.cityId ||
      this.cityContextService.getCityId();

    if (!requestedCityId) {
      throw new BadRequestException('City ID is required');
    }

    // Get user's accessible city IDs
    const userCityIds = this.cityContextService.getCityIds() || [];

    // Check if user has access to the requested city
    if (!userCityIds.includes(requestedCityId)) {
      throw new ForbiddenException('You do not have access to this city');
    }

    // Set the city context for the request
    this.cityContextService.setCityId(requestedCityId);

    return true;
  }
}
