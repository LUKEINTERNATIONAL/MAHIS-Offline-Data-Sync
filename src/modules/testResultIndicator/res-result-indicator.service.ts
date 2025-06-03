import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestResultIndicator, TestResultIndicatorDocument } from './schema/test-result-indicator.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { TestTypeService } from '../testTypes/test-type.service';

@Injectable()
export class TestResultIndicatorService {
  constructor(
    @InjectModel(TestResultIndicator.name)
    private testResultIndicatorModel: Model<TestResultIndicatorDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
    private testTypeService: TestTypeService,
  ) {}

  async create(data: Partial<TestResultIndicator>): Promise<TestResultIndicator> {
    return this.testResultIndicatorModel.create(data);
  }

  async findAll(): Promise<TestResultIndicator[]> {
    return this.testResultIndicatorModel.find().exec();
  }

  async findById(id: number): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<TestResultIndicator>): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel.findOneAndDelete({ id }).exec();
  }

  async loadIndicators(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      const authRes$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authRes = await lastValueFrom(authRes$);
      const token = authRes.data.authorization.token;

      const indicatorsRes$ = this.httpService.get(
        `${apiUrl}/test-result-indicators?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const indicatorsRes = await lastValueFrom(indicatorsRes$);
      const indicators = indicatorsRes.data;

      const testTypes = await this.testTypeService.findAll();

      console.log({testTypes});

      const bulkOps = indicators.map(({ id, ...rest }) => ({
        updateOne: {
          filter: { id },
          update: { $set: { id, ...rest } },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.testResultIndicatorModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} test result indicators loaded.`);
      } else {
        console.log('No test result indicators found.');
      }
    } catch (error) {
      console.error('Failed to load indicators:', error?.response?.data || error);
      throw new Error('Could not load test result indicators');
    }
  }
}
