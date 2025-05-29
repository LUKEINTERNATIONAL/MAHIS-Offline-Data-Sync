import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stock, StockDocument } from './schema/stock.schema';


@Injectable()
export class StockService {
  constructor(
    @InjectModel(Stock.name)
    private stockModel: Model<StockDocument>,
  ) {}

  async create(data: Partial<Stock>): Promise<Stock> {
    return this.stockModel.create(data);
  }

  async findAll(): Promise<Stock[]> {
    return this.stockModel.find().exec();
  }

  async findById(id: number): Promise<Stock | null> {
    return this.stockModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Stock>): Promise<Stock | null> {
    return this.stockModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Stock | null> {
    return this.stockModel.findOneAndDelete({ id }).exec();
  }
}
