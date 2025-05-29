import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestResultIndicator, TestResultIndicatorDocument } from './schema/test-result-indicator.schema';


@Injectable()
export class TestResultIndicatorService {
  constructor(
    @InjectModel(TestResultIndicator.name)
    private testResultIndicatorModel: Model<TestResultIndicatorDocument>,
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
}
