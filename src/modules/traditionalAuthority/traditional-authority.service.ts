import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TraditionalAuthority, TraditionalAuthorityDocument } from './schema/traditional-authority.schema';


@Injectable()
export class TraditionalAuthorityService {
  constructor(
    @InjectModel(TraditionalAuthority.name)
    private traditionalAuthorityModel: Model<TraditionalAuthorityDocument>,
  ) {}

  async create(data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority> {
    return this.traditionalAuthorityModel.create(data);
  }

  async findAll(): Promise<TraditionalAuthority[]> {
    return this.traditionalAuthorityModel.find().exec();
  }

  async findById(id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<TraditionalAuthority>): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<TraditionalAuthority | null> {
    return this.traditionalAuthorityModel.findOneAndDelete({ id }).exec();
  }
}
