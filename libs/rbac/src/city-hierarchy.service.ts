import { Injectable } from '@nestjs/common';
import { PrismaCityService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';

@Injectable()
export class CityHierarchyService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prismaCity: PrismaCityService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('CityHierarchyService');
  }

  /**
   * Get all child cities for a given city (recursively or direct only)
   * @param cityId Parent city ID
   * @param recursive If true, returns all descendants; if false, only direct children
   * @returns Array of child city IDs
   */
  async getChildCities(cityId: string, recursive: boolean = true): Promise<string[]> {
    try {
      const childCityIds: string[] = [];

      const getChildren = async (parentId: string): Promise<void> => {
        const children = await this.prismaCity.city.findMany({
          where: {
            parentCityId: parentId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        for (const child of children) {
          childCityIds.push(child.id);
          if (recursive) {
            await getChildren(child.id);
          }
        }
      };

      await getChildren(cityId);
      return childCityIds;
    } catch (error) {
      this.logger.error(`Error getting child cities for ${cityId}`, error);
      return [];
    }
  }

  /**
   * Get all cities a user manages (assigned cities + their children)
   * @param cityIds Array of city IDs the user is assigned to
   * @returns Array of all managed city IDs (includes assigned + children)
   */
  async getAllManagedCities(cityIds: string[]): Promise<string[]> {
    try {
      const managedCityIds = new Set<string>(cityIds);

      for (const cityId of cityIds) {
        const childCities = await this.getChildCities(cityId, true);
        childCities.forEach((childId) => managedCityIds.add(childId));
      }

      return Array.from(managedCityIds);
    } catch (error) {
      this.logger.error('Error getting all managed cities', error);
      return cityIds;
    }
  }

  /**
   * Check if a city is within the managed scope
   * @param cityId City to check
   * @param managedCityIds Array of city IDs that are managed
   * @returns true if city is in scope
   */
  isCityInScope(cityId: string, managedCityIds: string[]): boolean {
    return managedCityIds.includes(cityId);
  }

  /**
   * Get the full city path (city + all parent cities up to root)
   * @param cityId Starting city ID
   * @returns Array of cities from root to the specified city
   */
  async getCityPath(
    cityId: string,
  ): Promise<Array<{ id: string; name: string; parentCityId: string | null }>> {
    try {
      const path: Array<{ id: string; name: string; parentCityId: string | null }> = [];
      let currentCityId: string | null = cityId;

      while (currentCityId) {
        const city = await this.prismaCity.city.findUnique({
          where: { id: currentCityId },
          select: {
            id: true,
            name: true,
            parentCityId: true,
          },
        });

        if (!city) {
          break;
        }

        path.unshift({ id: city.id, name: city.name, parentCityId: city.parentCityId });
        currentCityId = city.parentCityId;
      }

      return path;
    } catch (error) {
      this.logger.error(`Error getting city path for ${cityId}`, error);
      return [];
    }
  }

  /**
   * Get all cities for hierarchical viewing (selected city + parents + children)
   * Used when citizens select a city to view content
   * @param cityId Selected city ID
   * @returns Array of city IDs (parents + selected + children)
   */
  async getHierarchicalCities(cityId: string): Promise<string[]> {
    try {
      const cityIds = new Set<string>([cityId]);

      // Get all parent cities
      const path = await this.getCityPath(cityId);
      path.forEach((city) => cityIds.add(city.id));

      // Get all child cities
      const childCities = await this.getChildCities(cityId, true);
      childCities.forEach((childId) => cityIds.add(childId));

      return Array.from(cityIds);
    } catch (error) {
      this.logger.error(`Error getting hierarchical cities for ${cityId}`, error);
      return [cityId];
    }
  }
}
