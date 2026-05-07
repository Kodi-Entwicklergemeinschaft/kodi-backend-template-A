import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { UserRole } from '@prisma/client-core';
import { LoggerService } from '@kodi/logger';
import { PermissionService } from './permission.service';
import { CityHierarchyService } from './city-hierarchy.service';

@Injectable()
export class UserContextService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly permissionService: PermissionService,
    private readonly cityHierarchy: CityHierarchyService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('UserContextService');
  }

  /**
   * Get all cities a user can manage (including child cities)
   * @param userId User ID
   * @param role User role (if known, otherwise fetched from assignments)
   */
  async getUserManagedCities(userId: string, role?: UserRole): Promise<string[]> {
    try {
      const assignments = await this.permissionService.getUserCityAssignments(userId);

      if (assignments.length === 0) {
        return [];
      }

      // Super Admin manages all cities (return empty array to indicate "all")
      const hasSuperAdmin = assignments.some((a) => a.role === UserRole.SUPER_ADMIN);
      if (hasSuperAdmin) {
        return []; // Empty array means "all cities"
      }

      // Get all assigned cities
      const assignedCityIds = assignments
        .filter((a) => a.role === UserRole.CITY_ADMIN)
        .map((a) => a.cityId);

      // Include children for each assigned city
      return await this.cityHierarchy.getAllManagedCities(assignedCityIds);
    } catch (error) {
      this.logger.error('Error getting user managed cities', error);
      return [];
    }
  }

  /**
   * Get effective permissions for a user (optionally scoped to a city)
   * @param userId User ID
   * @param cityId Optional city ID for city-scoped permissions
   */
  async getUserEffectivePermissions(
    userId: string,
    cityId?: string,
  ): Promise<
    Array<{
      resource: string;
      action: string;
      description: string | null;
    }>
  > {
    try {
      const assignments = await this.permissionService.getUserCityAssignments(userId);

      if (assignments.length === 0) {
        // Default to CITIZEN permissions
        return await this.permissionService.getRolePermissions(UserRole.CITIZEN);
      }

      // Super Admin has all permissions
      const hasSuperAdmin = assignments.some((a) => a.role === UserRole.SUPER_ADMIN);
      if (hasSuperAdmin) {
        // Return all available permissions (you might want to fetch all from DB)
        const allPermissions = await this.prisma.permission.findMany();
        return allPermissions.map((p) => ({
          resource: p.resource,
          action: p.action,
          description: p.description,
        }));
      }

      // For city admins, check city scope
      if (cityId) {
        const managedCityIds = await this.cityHierarchy.getAllManagedCities(
          assignments.map((a) => a.cityId),
        );
        if (!this.cityHierarchy.isCityInScope(cityId, managedCityIds)) {
          return [];
        }
      }

      // Get permissions from all roles user has
      const roleSet = new Set(assignments.map((a) => a.role));
      const allPermissions: Map<
        string,
        { resource: string; action: string; description: string | null }
      > = new Map();

      for (const role of roleSet) {
        const rolePerms = await this.permissionService.getRolePermissions(role);
        rolePerms.forEach((perm) => {
          const key = `${perm.resource}:${perm.action}`;
          if (!allPermissions.has(key)) {
            allPermissions.set(key, {
              resource: perm.resource,
              action: perm.action,
              description: perm.description,
            });
          }
        });
      }

      return Array.from(allPermissions.values());
    } catch (error) {
      this.logger.error('Error getting user effective permissions', error);
      return [];
    }
  }

  /**
   * Check if user can access a specific city
   * @param userId User ID
   * @param cityId City ID to check
   */
  async canAccessCity(userId: string, cityId: string): Promise<boolean> {
    try {
      const assignments = await this.permissionService.getUserCityAssignments(userId);

      // Super Admin can access all cities
      const hasSuperAdmin = assignments.some((a) => a.role === UserRole.SUPER_ADMIN);
      if (hasSuperAdmin) {
        return true;
      }

      // Citizens can access all cities (global scope)
      // But they might have a preferred city for content creation
      // For now, all users can access all cities for viewing

      // City Admins can only access their managed cities
      const cityAdminAssignments = assignments.filter((a) => a.role === UserRole.CITY_ADMIN);
      if (cityAdminAssignments.length > 0) {
        const managedCityIds = await this.cityHierarchy.getAllManagedCities(
          cityAdminAssignments.map((a) => a.cityId),
        );
        return this.cityHierarchy.isCityInScope(cityId, managedCityIds);
      }

      // Default: all users can access all cities (for viewing)
      return true;
    } catch (error) {
      this.logger.error('Error checking city access', error);
      return false;
    }
  }

  /**
   * Check if user can manage a specific city (CRUD operations)
   * @param userId User ID
   * @param cityId City ID to check
   */
  async canManageCity(userId: string, cityId: string): Promise<boolean> {
    try {
      const assignments = await this.permissionService.getUserCityAssignments(userId);

      // Super Admin can manage all cities
      const hasSuperAdmin = assignments.some((a) => a.role === UserRole.SUPER_ADMIN);
      if (hasSuperAdmin) {
        return true;
      }

      // City Admins can only manage their assigned cities + children
      const cityAdminAssignments = assignments.filter((a) => a.role === UserRole.CITY_ADMIN);
      if (cityAdminAssignments.length === 0) {
        return false;
      }

      const managedCityIds = await this.cityHierarchy.getAllManagedCities(
        cityAdminAssignments.map((a) => a.cityId),
      );
      return this.cityHierarchy.isCityInScope(cityId, managedCityIds);
    } catch (error) {
      this.logger.error('Error checking city management', error);
      return false;
    }
  }
}
