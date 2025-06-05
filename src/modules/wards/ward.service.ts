import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom } from 'rxjs';
import { Ward, WardDocument } from './schema/ward.schema';
import { Model } from 'mongoose';
import { clear } from 'console';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WardService {
  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Ward>): Promise<Ward> {
    return this.wardModel.create(data);
  }

  async findAll(): Promise<Ward[]> {
    return this.wardModel.find().exec();
  }

  async findById(location_id: number): Promise<Ward | null> {
    return this.wardModel.findOne({ location_id }).exec();
  }

  async update(location_id: number, data: Partial<Ward>): Promise<Ward | null> {
    return this.wardModel.findOneAndUpdate({ location_id }, data, { new: true }).exec();
  }

  async delete(location_id: number): Promise<Ward | null> {
    return this.wardModel.findOneAndDelete({ location_id }).exec();
  }

  async count(): Promise<number> {
    return this.wardModel.countDocuments().exec();
  }

  async loadWards(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

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
      await this.wardModel.deleteMany({});

      if (wards.length > 0) {
        await this.wardModel.insertMany(wards);
        console.log(`${wards.length} wards loaded.`);
      } else {
        console.log('No wards found.');
      }
    } catch (error) {
      console.error('Failed to load wards:', error?.response?.data || error);
      throw new Error('Could not load wards');
    }
  }
}