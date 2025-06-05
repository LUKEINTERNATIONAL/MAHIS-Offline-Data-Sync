import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Stock, StockDocument } from "./schema/stock.schema";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Stock.name)
    private stockModel: Model<StockDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Stock>): Promise<Stock> {
    return this.stockModel.create(data);
  }

  async findAll(): Promise<Stock[]> {
    return this.stockModel.find().exec();
  }

  async findById(id: number): Promise<Stock | null> {
    return this.stockModel.findOne({ pharmacy_batch_id: id }).exec();
  }

  async count(): Promise<number> {
    return this.stockModel.countDocuments().exec();
  }

  async loadStock(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

      const stockRes$ = this.httpService.get(`${apiUrl}/pharmacy/items?paginate=false`, {
        headers: {
          Authorization: token,
        },
      });
      const stockRes = await lastValueFrom(stockRes$);
      const stocks = stockRes.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log("No new stock records have been added since the last sync");
        return;
      }

      // Step 1: Clear the collection
      await this.stockModel.deleteMany({});

      // Step 2: Insert all fetched stock records
      if (stocks.length > 0) {
        await this.stockModel.insertMany(stocks);
        console.log(`${stocks.length} stock records loaded.`);
      } else {
        console.log("No stock records found.");
      }
    } catch (error) {
      console.error("Failed to load stock:", error?.response?.data || error);
      throw new Error("Could not load stock records");
    }
  }
}
