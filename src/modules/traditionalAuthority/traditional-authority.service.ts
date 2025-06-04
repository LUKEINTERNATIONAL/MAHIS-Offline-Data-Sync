import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TraditionalAuthority, TraditionalAuthorityDocument } from './schema/traditional-authority.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TraditionalAuthorityService {
  constructor(
    @InjectModel(TraditionalAuthority.name)
    private traditionalAuthorityModel: Model<TraditionalAuthorityDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority> {
    return this.traditionalAuthorityModel.create(data);
  }

  async findAll(): Promise<TraditionalAuthority[]> {
    return this.traditionalAuthorityModel.find().exec();
  }

  async findById(id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndDelete({ id }).exec();
  }

  async loadTraditionalAuthorities(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');
  
      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;
  
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
  
      const bulkOps = authorities.map(({ traditional_authority_id, ...rest }) => ({
        updateOne: {
          filter: { traditional_authority_id },
          update: { $set: { traditional_authority_id, ...rest } },
          upsert: true,
        },
      }));
  
      if (bulkOps.length > 0) {
        await this.traditionalAuthorityModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} traditional authorities loaded.`);
      } else {
        console.log('No traditional authorities found to load.');
      }
    } catch (error) {
      console.error('Failed to load traditional authorities:', error?.response?.data || error);
      throw new Error('Could not load traditional authorities');
    }
  }
  
}
