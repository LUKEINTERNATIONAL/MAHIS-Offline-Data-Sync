import { Injectable } from '@nestjs/common';
import { Village, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class VillageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.VillageCreateInput): Promise<Village> {
    return this.prisma.village.create({ data });
  }

  async findAll(): Promise<Village[]> {
    return this.prisma.village.findMany();
  }

  async findById(id: number): Promise<Village | null> {
    return this.prisma.village.findUnique({ where: { village_id: id } });
  }

  async update(id: number, data: Partial<Village>): Promise<Village | null> {
    return this.prisma.village.update({
      where: { village_id: id },
      data,
    });
  }

  async delete(id: number): Promise<Village | null> {
    return this.prisma.village.delete({ where: { village_id: id } });
  }

  async count(): Promise<number> {
    return this.prisma.village.count();
  }

  async loadVillages(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      // Fetch villages
      const villagesResponse$ = this.httpService.get(
        `${apiUrl}/villages?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const villagesResponse = await lastValueFrom(villagesResponse$);
      const villages = villagesResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log('No new villages have been added since the last sync');
        return;
      }

      // Clear existing
      await this.prisma.village.deleteMany({});

      // Insert fresh
      if (villages.length > 0) {
        await this.prisma.village.createMany({ data: villages });
        console.log(`${villages.length} villages loaded.`);
      } else {
        console.log('No villages found.');
      }
    } catch (error) {
      console.error('Failed to load villages:', error?.response?.data || error);
      // throw new Error('Could not load villages');
    }
  }
}
