import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { CreateTagDto, TagFilterDto, TagListResponseDto, TagResponseDto } from '@kodi/contracts';
import { Prisma, Tag } from '@prisma/client-core';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(TagsService.name);
  }

  async listTags(filter: TagFilterDto): Promise<TagListResponseDto> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSizeCandidate = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 20;
    const pageSize = Math.min(pageSizeCandidate, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.TagWhereInput = {};

    if (filter.provider) {
      where.provider = filter.provider;
    }

    if (filter.search) {
      where.OR = [
        { externalValue: { contains: filter.search, mode: Prisma.QueryMode.insensitive } },
        { label: { contains: filter.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      items: items.map((tag) => this.mapTag(tag)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getTagById(id: string): Promise<TagResponseDto> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException({ message: 'Tag not found', errorCode: 'TAG_NOT_FOUND' });
    }

    return this.mapTag(tag);
  }

  async createTag(dto: CreateTagDto): Promise<TagResponseDto> {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          provider: 'MANUAL',
          externalValue: dto.externalValue.trim(),
          label: dto.label?.trim(),
          languageCode: dto.languageCode?.trim(),
        },
      });

      return this.mapTag(tag);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException({
          message: 'Tag already exists for this provider',
          errorCode: 'TAG_ALREADY_EXISTS',
        });
      }
      this.logger.error('Failed to create tag', error);
      throw error;
    }
  }

  async deleteTag(id: string): Promise<void> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException({ message: 'Tag not found', errorCode: 'TAG_NOT_FOUND' });
    }

    const usage = await this.prisma.listingTag.count({
      where: { tagId: id },
    });

    if (usage > 0) {
      throw new BadRequestException({
        message: 'Tag is currently assigned to listings',
        errorCode: 'TAG_IN_USE',
      });
    }

    await this.prisma.tag.delete({
      where: { id },
    });
  }

  private mapTag(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      provider: tag.provider,
      externalValue: tag.externalValue,
      label: tag.label,
      languageCode: tag.languageCode,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
