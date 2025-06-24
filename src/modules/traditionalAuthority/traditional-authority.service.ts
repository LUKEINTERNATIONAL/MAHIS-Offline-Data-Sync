import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TraditionalAuthority } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class TraditionalAuthorityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.TraditionalAuthorityCreateInput): Promise<TraditionalAuthority> {
    return this.prisma.traditionalAuthority.create({ data });
  }

  async findAll(): Promise<TraditionalAuthority[]> {
    return this.prisma.traditionalAuthority.findMany();
  }

  async findById(traditional_authority_id: number): Promise<TraditionalAuthority | null> {
    return this.prisma.traditionalAuthority.findUnique({ where: { traditional_authority_id } });
  }

  async update(traditional_authority_id: number, data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority | null> {
    return this.prisma.traditionalAuthority.update({
      where: { traditional_authority_id },
      data,
    });
  }

  async delete(traditional_authority_id: number): Promise<TraditionalAuthority | null> {
    return this.prisma.traditionalAuthority.delete({ where: { traditional_authority_id } });
  }

  async count(): Promise<number> {
    return this.prisma.traditionalAuthority.count();
  }

  async loadTraditionalAuthorities(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        // this.logger.error("Failed to authenticate")
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      // Fetch traditional authorities
      const taResponse$ = this.httpService.get(
        `${apiUrl}/traditional_authorities?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const taResponse = await lastValueFrom(taResponse$);
      const authorities = taResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log('No new traditional authorities have been added since the last sync');
        return;
      }

      // Clear existing
      await this.prisma.traditionalAuthority.deleteMany({});

      // Insert fresh
      if (authorities.length > 0) {
        await this.prisma.traditionalAuthority.createMany({ data: authorities });
        console.log(`${authorities.length} traditional authorities loaded.`);
      } else {
        console.log('No traditional authorities found.');
      }
    } catch (error) {
      console.error('Failed to load traditional authorities:', error?.response?.data || error);
      // throw new Error('Could not load traditional authorities');
    }
  }
}