import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestType, TestTypeDocument } from './schema/test-type.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TestTypeService {
  constructor(
    @InjectModel(TestType.name)
    private testTypeModel: Model<TestTypeDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: Partial<TestType>): Promise<TestType> {
    return this.testTypeModel.create(data);
  }

  async findAll(): Promise<TestType[]> {
    return this.testTypeModel.find().exec();
  }

  async findById(id: number): Promise<TestType | null> {
    return this.testTypeModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<TestType>): Promise<TestType | null> {
    return this.testTypeModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<TestType | null> {
    return this.testTypeModel.findOneAndDelete({ id }).exec();
  }

  // Bulk loader method for test types
  async loadTestTypes(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch test types
      const testTypesResponse$ = this.httpService.get(
        `${apiUrl}/get_test_types?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const testTypesResponse = await lastValueFrom(testTypesResponse$);
      const testTypes = testTypesResponse.data;

      // Bulk upsert
      const bulkOps = testTypes
        .map(({ concept_id, ...rest }) => ({
          updateOne: {
            filter: { concept_id },
            update: { $set: { concept_id, ...rest } },
            upsert: true,
          },
        }));

      if (bulkOps.length > 0) {
        await this.testTypeModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} test types loaded.`);
      } else {
        console.log('No test types found to load.');
      }
    } catch (error) {
      console.error('Failed to load test types:', error?.response?.data || error);
      throw new Error('Could not load test types');
    }
  }
}
