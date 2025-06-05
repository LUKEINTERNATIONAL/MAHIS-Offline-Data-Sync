import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Drug, DrugDocument } from './schema/drug.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DrugService {
  constructor(
    @InjectModel(Drug.name)
    private readonly drugModel: Model<DrugDocument>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Drug>): Promise<Drug> {
    return this.drugModel.create(data);
  }

  async findAll(): Promise<Drug[]> {
    return this.drugModel.find().exec();
  }

  async findById(id: number): Promise<Drug | null> {
    return this.drugModel.findOne({ drug_id: id }).exec();
  }

  async count(): Promise<number> {
    return this.drugModel.countDocuments().exec();
  }

  async update(id: number, data: Partial<Drug>): Promise<Drug | null> {
    return this.drugModel.findOneAndUpdate({ drug_id: id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Drug | null> {
    return this.drugModel.findOneAndDelete({ drug_id: id }).exec();
  }

  async loadDrugs(expectedCount?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

      // Fetch all drugs without pagination
      const drugsResponse$ = this.httpService.get(`${apiUrl}/drugs?paginate=false`, {
        headers: { Authorization: token },
      });
      const drugsResponse = await lastValueFrom(drugsResponse$);
      const drugs = drugsResponse.data;

      // Check if data is already up-to-date
      const totalInDb = await this.count();
      if (expectedCount && totalInDb === expectedCount) {
        console.log('Drugs already up to date.');
        return;
      }

      // Step 1: Clear existing drugs collection
      await this.drugModel.deleteMany({});

      // Step 2: Bulk insert fetched drugs
      if (drugs.length > 0) {
        await this.drugModel.insertMany(drugs);
        console.log(`${drugs.length} drugs loaded.`);
      } else {
        console.log('No drugs found.');
      }
    } catch (error) {
      console.error('Failed to load drugs:', error?.response?.data || error);
      throw new Error('Could not load drugs.');
    }
  }
}
