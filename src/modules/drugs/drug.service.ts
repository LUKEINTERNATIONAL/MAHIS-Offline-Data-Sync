import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Drug, DrugDocument } from './schema/drug.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DrugService {
  constructor(
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async create(data: Partial<Drug>): Promise<Drug> {
    return this.drugModel.create(data);
  }

  async findAll(): Promise<Drug[]> {
    return this.drugModel.find().exec();
  }

  async findById(id: number): Promise<Drug | null> {
    return this.drugModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Drug>): Promise<Drug | null> {
    return this.drugModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Drug | null> {
    return this.drugModel.findOneAndDelete({ id }).exec();
  }

  async loadDrugs(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');
  
      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;
  
      // Fetch drug data
      const drugsResponse$ = this.httpService.get(
        `${apiUrl}/drugs?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const drugsResponse = await lastValueFrom(drugsResponse$);
      const drugs = drugsResponse.data;
  
      // Filter out entries with missing drug_id AND ensure id is not null
      const validDrugs = drugs.filter(
        (drug) => drug.drug_id !== null && drug.drug_id !== undefined && drug.id !== null
      );
  
      const skipped = drugs.length - validDrugs.length;
      if (skipped > 0) {
        console.warn(`Skipped ${skipped} drugs with missing drug_id or null id`);
      }
  
      // Bulk upsert drugs using drug_id as the unique identifier
      const bulkOps = validDrugs.map((drug) => {
        // Ensure we're not passing null id
        const updateData = { ...drug };
        if (updateData.id === null) {
          delete updateData.id;
        }
        
        return {
          updateOne: {
            filter: { drug_id: drug.drug_id },
            update: { $set: updateData },
            upsert: true,
          },
        };
      });
  
      if (bulkOps.length > 0) {
        await this.drugModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} drugs loaded.`);
      } else {
        console.log('No valid drugs found to load.');
      }
    } catch (error) {
      console.error('Failed to load drugs:', error?.response?.data || error);
      throw new Error('Could not load drugs');
    }
  }
}
