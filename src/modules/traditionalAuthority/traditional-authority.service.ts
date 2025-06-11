import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TraditionalAuthority, TraditionalAuthorityDocument } from './schema/traditional-authority.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TraditionalAuthorityService {
  constructor(
    @InjectModel(TraditionalAuthority.name)
    private traditionalAuthorityModel: Model<TraditionalAuthorityDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private authService: AuthService
  ) {}

  async create(data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority> {
    return this.traditionalAuthorityModel.create(data);
  }

  async findAll(): Promise<TraditionalAuthority[]> {
    return this.traditionalAuthorityModel.find().exec();
  }

  async findById(traditional_authority_id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOne({ traditional_authority_id }).exec();
  }

  async update(traditional_authority_id: number, data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndUpdate({ traditional_authority_id }, data, { new: true }).exec();
  }

  async delete(traditional_authority_id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndDelete({ traditional_authority_id }).exec();
  }

  async count(): Promise<number> {
    return this.traditionalAuthorityModel.countDocuments().exec();
  }

  async loadTraditionalAuthorities(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

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
      await this.traditionalAuthorityModel.deleteMany({});

      // Insert fresh
      if (authorities.length > 0) {
        await this.traditionalAuthorityModel.insertMany(authorities);
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
