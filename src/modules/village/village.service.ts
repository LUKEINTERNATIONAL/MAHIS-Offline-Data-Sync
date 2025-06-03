import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Village, VillageDocument } from './schema/village.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class VillageService {
  constructor(
    @InjectModel(Village.name)
    private villageModel: Model<VillageDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async create(data: Partial<Village>): Promise<Village> {
    return this.villageModel.create(data);
  }

  async findAll(): Promise<Village[]> {
    return this.villageModel.find().exec();
  }

  async findById(id: number): Promise<Village | null> {
    return this.villageModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Village>): Promise<Village | null> {
    return this.villageModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Village | null> {
    return this.villageModel.findOneAndDelete({ id }).exec();
  }

  async loadVillages(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch village data
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

      const bulkOps = villages.map(({ village_id, ...rest }) => ({
        updateOne: {
          filter: { village_id },
          update: { $set: { village_id, ...rest } },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.villageModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} villages loaded.`);
      } else {
        console.log('No villages found to load.');
      }
    } catch (error) {
      console.error('Failed to load villages:', error?.response?.data || error);
      throw new Error('Could not load villages');
    }
  }
}
