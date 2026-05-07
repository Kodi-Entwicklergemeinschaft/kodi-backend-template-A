import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCityService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import {
  CreateCityDto,
  UpdateCityDto,
  CityFilterDto,
  CitySortBy,
  CitySortDirection,
} from '@kodi/contracts';

@Injectable()
export class CityService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaCityService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(CityService.name);
  }

  async findAll(filterDto?: CityFilterDto) {
    const where: any = {};

    // Filter by country
    if (filterDto?.country) {
      where.country = filterDto.country;
    }

    // Filter by key
    if (filterDto?.key) {
      where.key = filterDto.key;
    }

    // Filter by isActive (default to true if not specified)
    if (filterDto?.isActive !== undefined) {
      where.isActive = filterDto.isActive;
    } else {
      where.isActive = true;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (filterDto?.sortBy) {
      orderBy[filterDto.sortBy] = filterDto.sortDirection || CitySortDirection.ASC;
    } else {
      // Default sorting by name ascending
      orderBy.name = CitySortDirection.ASC;
    }

    const cities = await this.prisma.city.findMany({
      where,
      orderBy,
    });
    return { items: cities };
  }

  async findOne(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundException({
        message: 'City not found',
        errorCode: 'CITY_NOT_FOUND',
        cityId: id,
      });
    }
    return city;
  }

  /**
   * Find a city by its unique key (e.g., 'kodi')
   * Returns null if not found (does not throw)
   */
  async findByKey(key: string) {
    const city = await this.prisma.city.findFirst({
      where: { key, isActive: true },
    });
    return city;
  }

  async create(dto: CreateCityDto) {
    const city = await this.prisma.city.create({ data: dto });
    this.logger.log(`City created: ${city.id}`);
    return city;
  }

  async update(id: string, dto: UpdateCityDto) {
    await this.findOne(id);
    const city = await this.prisma.city.update({ where: { id }, data: dto });
    this.logger.log(`City updated: ${id}`);
    return city;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.city.update({ where: { id }, data: { isActive: false } });
    this.logger.log(`City deleted: ${id}`);
    return { message: 'City deleted successfully' };
  }

  async findNearby(lat: number, lng: number, radiusKm: number) {
    // Simple distance calculation (Haversine formula can be implemented)
    const cities = await this.prisma.city.findMany({
      where: { isActive: true },
    });

    const nearbyCities = cities.filter((city) => {
      const distance = this.calculateDistance(lat, lng, city.latitude, city.longitude);
      return distance <= radiusKm;
    });
    return { items: nearbyCities };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
