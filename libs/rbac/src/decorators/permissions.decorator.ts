import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions
 * @param resource Resource name (e.g., 'users', 'cities')
 * @param action Action name (e.g., 'read', 'write')
 */
export const RequiresPermission = (resource: string, action: string) =>
  SetMetadata(PERMISSIONS_KEY, { resource, action });
