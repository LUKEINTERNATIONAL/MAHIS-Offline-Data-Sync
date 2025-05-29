import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from './schema/country.schema';


@Injectable()
export class CountryService {
  constructor(
    @InjectModel(Country.name)
    private countryModel: Model<CountryDocument>,
  ) {}

  async create(data: Partial<Country>): Promise<Country> {
    return this.countryModel.create(data);
  }

  async findAll(): Promise<Country[]> {
    return this.countryModel.find().exec();
  }

  async findById(id: number): Promise<Country | null> {
    return this.countryModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Country>): Promise<Country | null> {
    return this.countryModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Country | null> {
    return this.countryModel.findOneAndDelete({ id }).exec();
  }
}
