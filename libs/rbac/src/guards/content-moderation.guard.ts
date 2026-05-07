import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserContextService } from '../user-context.service';
import { PermissionService } from '../permission.service';
import { UserRole } from '@prisma/client-core';
import { numberToRole } from '../utils/role.utils';

@Injectable()
export class ContentModerationGuard implements CanActivate {
  constructor(
    private readonly userContext: UserContextService,
    private readonly permissionService: PermissionService,
  ) {}

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

    // Super Admin can moderate all content
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Citizens cannot moderate content
    if (userRole === UserRole.CITIZEN) {
      throw new ForbiddenException('Citizens cannot moderate content');
    }

    // Get cityId from request params, query, or body
    const cityId = request.params?.cityId || request.query?.cityId || request.body?.cityId;

    if (!cityId) {
      // For listing queries, allow if user has any city admin assignment
      // The service layer will filter by managed cities
      return userRole === UserRole.CITY_ADMIN;
    }

    // Check if user can moderate content in this city
    // City admins can moderate in their assigned cities + children
    const canManage = await this.userContext.canManageCity(userId, cityId);
    if (!canManage) {
      throw new ForbiddenException(`Content moderation denied for city: ${cityId}`);
    }

    // Also check if user has the listings:moderate permission
    const hasPermission = await this.permissionService.hasCityPermission(
      userId,
      cityId,
      'listings',
      'moderate',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `This route requires permission: listings:moderate for city ${cityId}`,
      );
    }

    return true;
  }
}
