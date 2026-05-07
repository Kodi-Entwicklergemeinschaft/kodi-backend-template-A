import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaAdminService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { CreateAdminDto, UpdateAdminDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaAdminService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AdminService');
  }

  async findAll(page = 1, limit = 10) {
    const effectivePage = page > 0 ? page : 1;
    const effectiveLimit = Math.min(limit > 0 ? limit : 10, 100);
    const skip = (effectivePage - 1) * effectiveLimit;
    const [admins, total] = await Promise.all([
      this.prisma.adminUser.findMany({
        where: { deletedAt: null },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.adminUser.count({ where: { deletedAt: null } }),
    ]);

    this.logger.log(`AdminService: Retrieved ${admins.length} admin users`);
    return {
      admins,
      total,
      page: effectivePage,
      limit: effectiveLimit,
      pages: Math.ceil(total / effectiveLimit),
    };
  }

  async findOne(id: string) {
    const admin = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      this.logger.warn(`AdminService: Admin user not found: ${id}`);
      throw new NotFoundException('Admin user not found');
    }

    this.logger.log(`AdminService: Retrieved admin user: ${id}`);
    return admin;
  }

  async create(dto: CreateAdminDto) {
    const admin = await this.prisma.adminUser.create({
      data: dto,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    this.logger.log(`AdminService: Created admin user: ${admin.id}`);
    return admin;
  }

  async update(id: string, dto: UpdateAdminDto) {
    await this.findOne(id); // Check existence

    const admin = await this.prisma.adminUser.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        updatedAt: true,
      },
    });

    this.logger.log(`AdminService: Updated admin user: ${id}`);
    return admin;
  }

  async delete(id: string) {
    await this.findOne(id); // Check existence

    // Soft delete
    await this.prisma.adminUser.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`AdminService: Deleted admin user: ${id}`);
    return { message: 'Admin user deleted successfully' };
  }
}
