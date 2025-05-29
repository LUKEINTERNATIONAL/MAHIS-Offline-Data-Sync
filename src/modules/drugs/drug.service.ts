import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Drug, DrugDocument } from './schema/drug.schema';


@Injectable()
export class DrugService {
  constructor(
    @InjectModel(Drug.name)
    private drugModel: Model<DrugDocument>,
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
}
