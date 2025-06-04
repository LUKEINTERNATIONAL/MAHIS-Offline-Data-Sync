import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Facility, FacilityDocument } from './schema/facility.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FacilityService {
  constructor(
    @InjectModel(Facility.name)
    private facilityModel: Model<FacilityDocument>,
    private configService: ConfigService,
    private httpService: HttpService
  ) {}

  async create(data: Partial<Facility>): Promise<Facility> {
    return this.facilityModel.create(data);
  }

  async findAll(): Promise<Facility[]> {
    return this.facilityModel.find().exec();
  }

  async findById(id: number): Promise<Facility | null> {
    return this.facilityModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Facility>): Promise<Facility | null> {
    return this.facilityModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Facility | null> {
    return this.facilityModel.findOneAndDelete({ id }).exec();
  }

  async loadFacilities(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

    
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

     
      const facilitiesResponse$ = this.httpService.get(
        `${apiUrl}/facilities?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const facilitiesResponse = await lastValueFrom(facilitiesResponse$);
      const facilities = facilitiesResponse.data.facilities;

     
      for (const facility of facilities) {
        const { id, ...rest } = facility;
        await this.facilityModel.findOneAndUpdate(
          { id },
          { id, ...rest },
          { upsert: true, new: true }
        );
      }

      console.log(`${facilities.length} facilities loaded.`);
    } catch (error) {
      console.error('Error loading facilities:', error?.response?.data || error);
      throw new Error('Failed to load facilities.');
    }
  }
}
