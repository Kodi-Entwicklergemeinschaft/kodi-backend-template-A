import { UserRole } from '@prisma/client-core';

/**
 * Role to number mapping
 */
export const ROLE_TO_NUMBER: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 1,
  [UserRole.CITY_ADMIN]: 2,
  [UserRole.CITIZEN]: 3,
};

/**
 * Number to role mapping
 */
export const NUMBER_TO_ROLE: Record<number, UserRole> = {
  1: UserRole.SUPER_ADMIN,
  2: UserRole.CITY_ADMIN,
  3: UserRole.CITIZEN,
};

/**
 * Convert UserRole enum to number
 */
export function roleToNumber(role: UserRole | string): number {
  if (typeof role === 'string') {
    const roleEnum = role as UserRole;
    return ROLE_TO_NUMBER[roleEnum] ?? 3; // Default to CITIZEN
  }
  return ROLE_TO_NUMBER[role] ?? 3;
}

/**
 * Convert number to UserRole enum
 */
export function numberToRole(roleNumber: number): UserRole {
  return NUMBER_TO_ROLE[roleNumber] ?? UserRole.CITIZEN;
}

/**
 * Convert role string to number (for backward compatibility)
 */
export function roleStringToNumber(roleString: string): number {
  const normalized = roleString.toUpperCase() as keyof typeof UserRole;
  const roleEnum = UserRole[normalized];
  return roleEnum ? ROLE_TO_NUMBER[roleEnum] : 3;
}
