import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom } from 'rxjs';
import { Ward, WardDocument } from './schema/ward.schema';
import { Model } from 'mongoose';

@Injectable()
export class WardService {
  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: Partial<Ward>): Promise<Ward> {
    return this.wardModel.create(data);
  }

  async findAll(): Promise<Ward[]> {
    return this.wardModel.find().exec();
  }

  async findById(id: number): Promise<Ward | null> {
    return this.wardModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Ward>): Promise<Ward | null> {
    return this.wardModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Ward | null> {
    return this.wardModel.findOneAndDelete({ id }).exec();
  }

  async loadWards(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch ward data
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

      // Bulk upsert
      const bulkOps = wards.map(({ location_id, ...rest }) => ({
        updateOne: {
          filter: { location_id },
          update: { $set: { location_id, ...rest } },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.wardModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} wards loaded.`);
      } else {
        console.log('No wards found to load.');
      }

    } catch (error) {
      console.error('Failed to load wards:', error?.response?.data || error);
      throw new Error('Could not load wards');
    }
  }
}
