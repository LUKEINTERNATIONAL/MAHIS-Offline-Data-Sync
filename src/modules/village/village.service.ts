import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Village, VillageDocument } from './schema/village.schema';


@Injectable()
export class VillageService {
  constructor(
    @InjectModel(Village.name)
    private villageModel: Model<VillageDocument>,
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
}
