import { Injectable } from '@nestjs/common';
import { Facility, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  async create(data: Prisma.FacilityCreateInput): Promise<Facility> {
    return this.prisma.facility.create({ data });
  }

  async findAll(): Promise<Facility[]> {
    return this.prisma.facility.findMany();
  }

  async findById(id: number): Promise<Facility | null> {
    return this.prisma.facility.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Facility>): Promise<Facility | null> {
    return this.prisma.facility.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Facility | null> {
    return this.prisma.facility.delete({ where: { id: id.toString() } });
  }

  async count(): Promise<number> {
    return this.prisma.facility.count();
  }

  async loadFacilities(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      // Fetch facilities
      const facilitiesResponse$ = this.httpService.get(
        `${apiUrl}/facilities?paginate=false`,
        {
          headers: { Authorization: token },
        },
      );
      const facilitiesResponse = await lastValueFrom(facilitiesResponse$);
      const facilities = facilitiesResponse.data.facilities || facilitiesResponse.data;

      // Check current count
      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log('No new facilities have been added since the last sync');
        return;
      }

      // Clear table
      await this.prisma.facility.deleteMany({});

      // Bulk insert
      if (facilities.length > 0) {
        await this.prisma.facility.createMany({ data: facilities });
        console.log(`${facilities.length} facilities loaded.`);
      } else {
        console.log('No facilities found.');
      }
    } catch (error) {
      console.error('Error loading facilities:', error?.response?.data || error);
      // throw new Error('Failed to load facilities.');
    }
  }
}
