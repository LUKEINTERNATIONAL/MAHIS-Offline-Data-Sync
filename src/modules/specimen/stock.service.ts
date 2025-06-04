import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Stock, StockDocument } from './schema/stock.schema';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Stock.name)
    private stockModel: Model<StockDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

  async loadStock(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      const authRes$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authRes = await lastValueFrom(authRes$);
      const token = authRes.data.authorization.token;

      const stockRes$ = this.httpService.get(`${apiUrl}/pharmacy/items?paginate=false`, {
        headers: {
          Authorization: token,
        },
      });
      const stockRes = await lastValueFrom(stockRes$);
      const stocks = stockRes.data;

      const bulkOps = stocks.map(({ pharmacy_batch_id, ...rest }) => ({
        updateOne: {
          filter: { pharmacy_batch_id },
          update: { $set: { pharmacy_batch_id, ...rest } },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.stockModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} stock records loaded.`);
      } else {
        console.log('No stock records found.');
      }
    } catch (error) {
      console.error(
        'Failed to load stock:',
        error?.response?.data || error,
      );
      throw new Error('Could not load stock records');
    }
  }
}
