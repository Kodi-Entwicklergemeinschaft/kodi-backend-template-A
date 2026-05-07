import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserContextService } from '../user-context.service';
import { UserRole } from '@prisma/client-core';
import { numberToRole } from '../utils/role.utils';

@Injectable()
export class CityScopeGuard implements CanActivate {
  constructor(private readonly userContext: UserContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Convert number role to enum if needed
    const userRoleNumber = typeof user.role === 'number' ? user.role : null;
    const userRole =
      userRoleNumber !== null ? numberToRole(userRoleNumber) : (user.role as UserRole);
    const userId = user.sub || user.userId;

    // Super Admin can access all cities
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Citizens can access all cities (global scope for viewing)
    if (userRole === UserRole.CITIZEN) {
      return true;
    }

    // City Admins need to check if they can access the city
    // Get cityId from request params or query
    const cityId = request.params?.cityId || request.query?.cityId || request.body?.cityId;

    if (!cityId) {
      // No city specified, allow access (will be checked at service level)
      return true;
    }

    const canAccess = await this.userContext.canAccessCity(userId, cityId);
    if (!canAccess) {
      throw new ForbiddenException(`Access denied for city: ${cityId}`);
    }

    return true;
  }
}
