import { SetMetadata } from '@nestjs/common';

export const CITY_ADMIN_ONLY_KEY = 'cityAdminOnly';

/**
 * Decorator to restrict route to City Admin or Super Admin
 */
export const CityAdminOnly = () => SetMetadata(CITY_ADMIN_ONLY_KEY, true);
