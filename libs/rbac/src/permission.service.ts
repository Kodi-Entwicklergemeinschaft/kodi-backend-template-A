import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { UserRole } from '@prisma/client-core';
import { LoggerService } from '@kodi/logger';
import { CityHierarchyService } from './city-hierarchy.service';
import { RedisService } from '@kodi/redis';

@Injectable()
export class PermissionService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly cityHierarchy: CityHierarchyService,
    private readonly redis: RedisService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('PermissionService');
  }

  /**
   * Check if user has a specific permission
   * @param userId User ID
   * @param resource Resource name (e.g., 'users', 'cities')
   * @param action Action name (e.g., 'read', 'write')
   * @param cityId Optional city ID for city-scoped permissions
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    cityId?: string,
  ): Promise<boolean> {
    try {
      // Check cache first
      const cacheKey = `permission:${userId}:${resource}:${action}${cityId ? `:${cityId}` : ''}`;
      const cached = await this.redis.get<string>(cacheKey);
      if (cached === 'true') {
        return true;
      }

      // Get user's role(s) from UserCityAssignment
      const assignments = await this.getUserCityAssignments(userId);
      if (assignments.length === 0) {
        // Default to CITIZEN if no assignments
        return await this.hasRolePermission(UserRole.CITIZEN, resource, action);
      }

      // For city-scoped checks, verify city is in user's managed scope
      if (cityId) {
        const managedCityIds = await this.cityHierarchy.getAllManagedCities(
          assignments.map((a) => a.cityId),
        );
        if (!this.cityHierarchy.isCityInScope(cityId, managedCityIds)) {
          return false;
        }
      }

      // Check if any of user's roles have the permission
      for (const assignment of assignments) {
        if (await this.hasRolePermission(assignment.role, resource, action)) {
          // Cache positive result
          await this.redis.set(cacheKey, 'true', 300); // 5 minutes TTL
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking permission', error);
      return false;
    }
  }

  /**
   * Check if a role has a specific permission
   */
  private async hasRolePermission(
    role: UserRole,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // Super Admin has all permissions
    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const permission = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
      include: {
        rolePermissions: {
          where: { role },
        },
      },
    });

    return (permission?.rolePermissions?.length ?? 0) > 0;
  }

  /**
   * Check if user has permission for a specific city
   * @param userId User ID
   * @param cityId City ID
   * @param resource Resource name
   * @param action Action name
   */
  async hasCityPermission(
    userId: string,
    cityId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    return this.hasPermission(userId, resource, action, cityId);
  }

  /**
   * Get user's city assignments
   * @param userId User ID
   */
  async getUserCityAssignments(userId: string) {
    try {
      return await this.prisma.userCityAssignment.findMany({
        where: {
          userId,
          isActive: true,
        },
      });
    } catch (error) {
      this.logger.error('Error getting user city assignments', error);
      return [];
    }
  }

  /**
   * Check if user can manage city admins for a specific city
   * @param userId User ID
   * @param targetCityId City ID to check
   */
  async canManageCityAdmins(userId: string, targetCityId: string): Promise<boolean> {
    try {
      const assignments = await this.getUserCityAssignments(userId);

      // Super Admin can manage admins in all cities
      const hasSuperAdmin = assignments.some((a) => a.role === UserRole.SUPER_ADMIN);
      if (hasSuperAdmin) {
        return true;
      }

      // Check if user is a city admin with canManageAdmins=true for this city or its parents
      const managedCityIds = await this.cityHierarchy.getAllManagedCities(
        assignments
          .filter((a) => a.role === UserRole.CITY_ADMIN && a.canManageAdmins)
          .map((a) => a.cityId),
      );

      return this.cityHierarchy.isCityInScope(targetCityId, managedCityIds);
    } catch (error) {
      this.logger.error('Error checking canManageCityAdmins', error);
      return false;
    }
  }

  /**
   * Check if user has a specific role
   * This is a simplified check - actual role should come from JWT/context
   */
  async hasRole(userRole: UserRole, requiredRole: UserRole): Promise<boolean> {
    // Super Admin has all permissions
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Role hierarchy: SUPER_ADMIN > CITY_ADMIN > CITIZEN
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: 3,
      [UserRole.CITY_ADMIN]: 2,
      [UserRole.CITIZEN]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Get all permissions for a user based on their role
   * @param role User role
   */
  async getUserPermissions(role: UserRole): Promise<string[]> {
    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: {
          role,
        },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
    } catch (error) {
      this.logger.error('Error getting user permissions', error);
      return [];
    }
  }

  /**
   * Get all permissions for a role
   * @param role User role
   */
  async getRolePermissions(role: UserRole): Promise<
    Array<{
      id: string;
      resource: string;
      action: string;
      description: string | null;
    }>
  > {
    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: {
          role,
        },
        include: {
          permission: true,
        },
      });

      return rolePermissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      }));
    } catch (error) {
      this.logger.error('Error getting role permissions', error);
      return [];
    }
  }
}
