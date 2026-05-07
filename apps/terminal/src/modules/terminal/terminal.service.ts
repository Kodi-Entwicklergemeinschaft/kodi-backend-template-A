import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaTerminalService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { CreateTerminalDto, UpdateTerminalDto } from './dto';

@Injectable()
export class TerminalService {
  constructor(
    private readonly prisma: PrismaTerminalService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('TerminalService');
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [terminals, total] = await Promise.all([
      this.prisma.terminal.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          code: true,
          cityId: true,
          location: true,
          status: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.terminal.count({ where: { deletedAt: null } }),
    ]);

    this.logger.log(`TerminalService: Retrieved ${terminals.length} terminals`);
    return { terminals, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const terminal = await this.prisma.terminal.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        cityId: true,
        location: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!terminal) {
      this.logger.warn(`TerminalService: Terminal not found: ${id}`);
      throw new NotFoundException('Terminal not found');
    }

    this.logger.log(`TerminalService: Retrieved terminal: ${id}`);
    return terminal;
  }

  async create(dto: CreateTerminalDto) {
    const terminal = await this.prisma.terminal.create({
      data: dto,
      select: {
        id: true,
        name: true,
        code: true,
        cityId: true,
        location: true,
        status: true,
        createdAt: true,
      },
    });

    this.logger.log(`TerminalService: Created terminal: ${terminal.id}`);
    return terminal;
  }

  async update(id: string, dto: UpdateTerminalDto) {
    await this.findOne(id); // Check existence

    const terminal = await this.prisma.terminal.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        code: true,
        cityId: true,
        location: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(`TerminalService: Updated terminal: ${id}`);
    return terminal;
  }

  async delete(id: string) {
    await this.findOne(id); // Check existence

    // Soft delete
    await this.prisma.terminal.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`TerminalService: Deleted terminal: ${id}`);
    return { message: 'Terminal deleted successfully' };
  }
}
