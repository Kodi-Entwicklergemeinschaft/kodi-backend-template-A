import { SetMetadata } from '@nestjs/common';

export const CITY_SCOPED_KEY = 'cityScoped';

/**
 * Decorator to mark routes that require city context
 * When applied, the route will only work with a valid cityId in context
 */
export const CityScoped = () => SetMetadata(CITY_SCOPED_KEY, true);
