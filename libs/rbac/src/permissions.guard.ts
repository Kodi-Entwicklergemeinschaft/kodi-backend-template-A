import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { PermissionService } from './permission.service';
import { UserRole } from '@prisma/client-core';
import { numberToRole } from './utils/role.utils';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionMetadata = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
      cityId?: string;
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!permissionMetadata) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Convert number role to enum if needed
    const userRoleNumber = typeof user.role === 'number' ? user.role : null;
    const userRole =
      userRoleNumber !== null ? numberToRole(userRoleNumber) : (user.role as UserRole);

    // Super Admin has all permissions
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Get cityId from metadata, request params, query, or body
    const cityId =
      permissionMetadata.cityId ||
      request.params?.cityId ||
      request.query?.cityId ||
      request.body?.cityId;

    // Check if user has the required permission (with optional city scope)
    const hasPermission = await this.permissionService.hasPermission(
      user.sub || user.userId,
      permissionMetadata.resource,
      permissionMetadata.action,
      cityId,
    );

    if (!hasPermission) {
      const scopeMsg = cityId ? ` for city ${cityId}` : '';
      throw new ForbiddenException(
        `This route requires permission: ${permissionMetadata.resource}:${permissionMetadata.action}${scopeMsg}`,
      );
    }

    return true;
  }
}
