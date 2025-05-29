import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Facility, FacilityDocument } from './schema/facility.schema';


@Injectable()
export class FacilityService {
  constructor(
    @InjectModel(Facility.name)
    private facilityModel: Model<FacilityDocument>,
  ) {}

  async create(data: Partial<Facility>): Promise<Facility> {
    return this.facilityModel.create(data);
  }

  async findAll(): Promise<Facility[]> {
    return this.facilityModel.find().exec();
  }

  async findById(id: number): Promise<Facility | null> {
    return this.facilityModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Facility>): Promise<Facility | null> {
    return this.facilityModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Facility | null> {
    return this.facilityModel.findOneAndDelete({ id }).exec();
  }
}
