#!/usr/bin/env ts-node
/**
 * Permission Seeding Script
 *
 * Seeds the permissions database with:
 * - All resources and actions
 * - RolePermission mappings for SUPER_ADMIN, CITY_ADMIN, and CITIZEN
 *
 * Run: npx ts-node scripts/seed-permissions.ts
 */

// Register tsconfig-paths to resolve TypeScript path mappings
import 'tsconfig-paths/register';

import { PrismaClient, Permission } from '@prisma/client-core';
import { UserRole } from '@prisma/client-core';

const prisma = new PrismaClient();

// Define all permissions (resource:action pairs)
const PERMISSIONS = [
  // City permissions
  { resource: 'cities', action: 'create', description: 'Create new cities/municipalities' },
  { resource: 'cities', action: 'read', description: 'View cities' },
  { resource: 'cities', action: 'update', description: 'Update cities' },
  { resource: 'cities', action: 'delete', description: 'Delete cities' },
  { resource: 'cities', action: 'manage', description: 'Full city management' },

  // User permissions
  { resource: 'users', action: 'create', description: 'Create users' },
  { resource: 'users', action: 'read', description: 'View users' },
  { resource: 'users', action: 'update', description: 'Update users' },
  { resource: 'users', action: 'delete', description: 'Delete users' },

  // City Admin management permissions
  { resource: 'city_admins', action: 'create', description: 'Assign city admins' },
  { resource: 'city_admins', action: 'read', description: 'View city admins' },
  { resource: 'city_admins', action: 'update', description: 'Update city admin assignments' },
  { resource: 'city_admins', action: 'delete', description: 'Remove city admin assignments' },

  // Listing/Content permissions
  { resource: 'listings', action: 'create', description: 'Create listings/content' },
  { resource: 'listings', action: 'read', description: 'View listings' },
  { resource: 'listings', action: 'update', description: 'Update listings' },
  { resource: 'listings', action: 'delete', description: 'Delete listings' },
  {
    resource: 'listings',
    action: 'moderate',
    description: 'Approve/reject listings for moderation',
  },
  { resource: 'city_categories', action: 'assign', description: 'Assign categories to a city' },
  { resource: 'city_categories', action: 'remove', description: 'Remove categories from a city' },
  {
    resource: 'city_categories',
    action: 'read',
    description: 'View categories assigned to a city',
  },
  { resource: 'category_requests', action: 'create', description: 'Request categories for a city' },
  { resource: 'category_requests', action: 'read', description: 'View city category requests' },
  {
    resource: 'category_requests',
    action: 'resolve',
    description: 'Resolve city category requests',
  },
  // Tile/Ad permissions
  { resource: 'tiles', action: 'create', description: 'Create ad tiles' },
  { resource: 'tiles', action: 'read', description: 'View ad tiles' },
  { resource: 'tiles', action: 'update', description: 'Update ad tiles' },
  { resource: 'tiles', action: 'delete', description: 'Delete ad tiles' },
];

// Define role-permission mappings
const ROLE_PERMISSIONS: Record<UserRole, Array<{ resource: string; action: string }>> = {
  [UserRole.SUPER_ADMIN]: [
    // SUPER_ADMIN has all permissions - explicitly list all
    ...PERMISSIONS.map((p) => ({ resource: p.resource, action: p.action })),
  ],
  [UserRole.CITY_ADMIN]: [
    // City management (scoped to their cities)
    { resource: 'cities', action: 'read' },
    { resource: 'cities', action: 'update' },
    { resource: 'cities', action: 'manage' },

    // View users
    { resource: 'users', action: 'read' },

    // City admin management (if canManageAdmins=true)
    { resource: 'city_admins', action: 'read' },
    { resource: 'city_admins', action: 'create' }, // Only if canManageAdmins=true (checked at service level)
    { resource: 'city_admins', action: 'update' }, // Only if canManageAdmins=true
    { resource: 'city_admins', action: 'delete' }, // Only if canManageAdmins=true

    // Content moderation
    { resource: 'listings', action: 'read' },
    { resource: 'listings', action: 'moderate' },
    { resource: 'listings', action: 'delete' },
    { resource: 'city_categories', action: 'read' },
    { resource: 'category_requests', action: 'create' },
    { resource: 'category_requests', action: 'read' },

    // Tile management
    { resource: 'tiles', action: 'create' },
    { resource: 'tiles', action: 'read' },
    { resource: 'tiles', action: 'update' },
    { resource: 'tiles', action: 'delete' },
  ],
  [UserRole.CITIZEN]: [
    // Citizens can create and view their own listings
    { resource: 'listings', action: 'create' },
    { resource: 'listings', action: 'read' },
    { resource: 'listings', action: 'update' }, // Only their own
    { resource: 'listings', action: 'delete' }, // Only their own

    // View cities (for selecting in UI)
    { resource: 'cities', action: 'read' },
  ],
};

async function seedPermissions() {
  console.log('🌱 Starting permission seeding...');

  try {
    // Create all permissions
    console.log('📝 Creating permissions...');
    const createdPermissions: Permission[] = [];

    for (const perm of PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {
          description: perm.description,
        },
        create: {
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
        },
      });
      createdPermissions.push(permission);
      console.log(`  ✓ ${perm.resource}:${perm.action}`);
    }

    console.log(`\n✅ Created ${createdPermissions.length} permissions\n`);

    // Create role-permission mappings
    console.log('🔗 Creating role-permission mappings...');

    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      console.log(`\n  Role: ${role}`);

      for (const perm of permissions) {
        const permission = await prisma.permission.findUnique({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
        });

        if (!permission) {
          console.warn(`  ⚠️  Permission ${perm.resource}:${perm.action} not found, skipping...`);
          continue;
        }

        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as UserRole,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            role: role as UserRole,
            permissionId: permission.id,
          },
        });
        console.log(`    ✓ ${perm.resource}:${perm.action}`);
      }
    }

    console.log('\n✅ Role-permission mappings created\n');

    // Summary
    const totalPermissions = await prisma.permission.count();
    const totalRolePermissions = await prisma.rolePermission.count();

    console.log('📊 Summary:');
    console.log(`  - Total Permissions: ${totalPermissions}`);
    console.log(`  - Total Role-Permission Mappings: ${totalRolePermissions}`);
    console.log('\n🎉 Permission seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedPermissions().catch((error) => {
  console.error(error);
  process.exit(1);
});
