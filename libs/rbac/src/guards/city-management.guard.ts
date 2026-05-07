import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserContextService } from '../user-context.service';
import { UserRole } from '@prisma/client-core';
import { numberToRole } from '../utils/role.utils';

@Injectable()
export class CityManagementGuard implements CanActivate {
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

    // Super Admin can manage all cities
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Get cityId from request params, query, or body
    const cityId = request.params?.cityId || request.query?.cityId || request.body?.cityId;

    if (!cityId) {
      // For create operations, check if user can manage any city
      if (userRole === UserRole.CITY_ADMIN) {
        throw new ForbiddenException('City Admins cannot create new cities');
      }
      // Only Super Admin can create cities (already handled above, so this is for CITIZEN)
      return false;
    }

    // Check if user can manage this specific city
    const canManage = await this.userContext.canManageCity(userId, cityId);
    if (!canManage) {
      throw new ForbiddenException(`City management denied for city: ${cityId}`);
    }

    return true;
  }
}
