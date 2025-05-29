import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ward, WardDocument } from './schema/ward.schema';


@Injectable()
export class WardService {
  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
  ) {}

  async create(data: Partial<Ward>): Promise<Ward> {
    return this.wardModel.create(data);
  }

  async findAll(): Promise<Ward[]> {
    return this.wardModel.find().exec();
  }

  async findById(id: number): Promise<Ward | null> {
    return this.wardModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Ward>): Promise<Ward | null> {
    return this.wardModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Ward | null> {
    return this.wardModel.findOneAndDelete({ id }).exec();
  }
}
