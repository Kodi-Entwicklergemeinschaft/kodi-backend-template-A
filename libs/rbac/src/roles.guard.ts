import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@kodi/jwt';
import { UserRole } from '@prisma/client-core';
import { numberToRole } from './utils/role.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
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

    // Super Admin has access to everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user has one of the required roles
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `This route requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
