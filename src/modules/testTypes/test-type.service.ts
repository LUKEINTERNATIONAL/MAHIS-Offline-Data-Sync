import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestType, TestTypeDocument } from './schema/test-type.schema';


@Injectable()
export class TestTypeService {
  constructor(
    @InjectModel(TestType.name)
    private testTypeModel: Model<TestTypeDocument>,
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
}
