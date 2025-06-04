import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Specimen, SpecimenDocument } from './schema/specimen.schema';

@Injectable()
export class SpecimenService {
  constructor(
    @InjectModel(Specimen.name)
    private specimenModel: Model<SpecimenDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: Partial<Specimen>): Promise<Specimen> {
    return this.specimenModel.create(data);
  }

  async findAll(): Promise<Specimen[]> {
    return this.specimenModel.find().exec();
  }

  async findById(id: number): Promise<Specimen | null> {
    return this.specimenModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Specimen>): Promise<Specimen | null> {
    return this.specimenModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Specimen | null> {
    return this.specimenModel.findOneAndDelete({ id }).exec();
  }

  async loadSpecimen(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      const authRes$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authRes = await lastValueFrom(authRes$);
      const token = authRes.data.authorization.token;

      const specimenRes$ = this.httpService.get(`${apiUrl}/lab/specimen_types?paginate=false`, {
        headers: {
          Authorization: token,
        },
      });
      const specimenRes = await lastValueFrom(specimenRes$);
      const specimens = specimenRes.data;

      const bulkOps = specimens.map(({ concept_id, ...rest }) => ({
        updateOne: {
          filter: { concept_id },
          update: { $set: { concept_id, ...rest } },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.specimenModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} specimen records loaded.`);
      } else {
        console.log('No specimen records found.');
      }
    } catch (error) {
      console.error(
        'Failed to load specimen:',
        error?.response?.data || error,
      );
      throw new Error('Could not load specimen records');
    }
  }
}
