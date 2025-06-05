import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Village, VillageDocument } from './schema/village.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class VillageService {
  constructor(
    @InjectModel(Village.name)
    private villageModel: Model<VillageDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Village>): Promise<Village> {
    return this.villageModel.create(data);
  }

  async findAll(): Promise<Village[]> {
    return this.villageModel.find().exec();
  }

  async findById(village_id: number): Promise<Village | null> {
    return this.villageModel.findOne({ village_id }).exec();
  }

  async update(village_id: number, data: Partial<Village>): Promise<Village | null> {
    return this.villageModel.findOneAndUpdate({ village_id }, data, { new: true }).exec();
  }

  async delete(village_id: number): Promise<Village | null> {
    return this.villageModel.findOneAndDelete({ village_id }).exec();
  }

  async count(): Promise<number> {
    return this.villageModel.countDocuments().exec();
  }

  async loadVillages(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

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
      await this.villageModel.deleteMany({});

      // Insert fresh
      if (villages.length > 0) {
        await this.villageModel.insertMany(villages);
        console.log(`${villages.length} villages loaded.`);
      } else {
        console.log('No villages found.');
      }
    } catch (error) {
      console.error('Failed to load villages:', error?.response?.data || error);
      throw new Error('Could not load villages');
    }
  }
}
