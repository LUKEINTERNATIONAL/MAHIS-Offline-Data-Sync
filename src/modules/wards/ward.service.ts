import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Ward, Prisma } from '@prisma/client';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class WardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.WardCreateInput): Promise<Ward> {
    return this.prisma.ward.create({ data });
  }

  async findAll(): Promise<Ward[]> {
    return this.prisma.ward.findMany();
  }

  async findById(location_id: number): Promise<Ward | null> {
    return this.prisma.ward.findUnique({ where: { location_id } });
  }

  async update(location_id: number, data: Partial<Ward>): Promise<Ward | null> {
    return this.prisma.ward.update({
      where: { location_id },
      data,
    });
  }

  async delete(location_id: number): Promise<Ward | null> {
    return this.prisma.ward.delete({ where: { location_id } });
  }

  async count(): Promise<number> {
    return this.prisma.ward.count();
  }

  async loadWards(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      // Fetch wards with filter tag "Facility adult sections"
      const wardsResponse$ = this.httpService.get(
        `${apiUrl}/locations?name=&tag=Facility adult sections&paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const wardsResponse = await lastValueFrom(wardsResponse$);
      const wards = wardsResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log('No new wards have been added since the last sync');
        return;
      }

      // Clear existing wards
      await this.prisma.ward.deleteMany({});

      if (wards.length > 0) {
        await this.prisma.ward.createMany({ data: wards });
        console.log(`${wards.length} wards loaded.`);
      } else {
        console.log('No wards found.');
      }
    } catch (error) {
      console.error('Failed to load wards:', error?.response?.data || error);
      // throw new Error('Could not load wards');
    }
  }
}