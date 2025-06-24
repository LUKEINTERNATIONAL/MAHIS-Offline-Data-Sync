import { Injectable } from "@nestjs/common";
import { Stock, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "../auth/auth.service";
import { lastValueFrom } from 'rxjs';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.StockCreateInput): Promise<Stock> {
    return this.prisma.stock.create({ data });
  }

  async findAll(): Promise<Stock[]> {
    return this.prisma.stock.findMany();
  }

  async findById(id: number): Promise<Stock | null> {
    return this.prisma.stock.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Stock>): Promise<Stock | null> {
    return this.prisma.stock.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Stock | null> {
    return this.prisma.stock.delete({ where: { id: id.toString() } });
  }

  async loadStock(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error("Failed to authenticate");
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      const stockRes$ = this.httpService.get(
        `${apiUrl}/pharmacy/items?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const stockRes = await lastValueFrom(stockRes$);
      const stocks = stockRes.data;

      const totalDocuments = await this.prisma.stock.count();

      if (totalDocuments === count) {
        console.log("No new stock records have been added since the last sync");
        return;
      }

      // Step 1: Clear the table
      await this.prisma.stock.deleteMany({});

      // Step 2: Insert all fetched stock records
      if (stocks.length > 0) {
        await this.prisma.stock.createMany({ data: stocks });
        console.log(`${stocks.length} stock records loaded.`);
      } else {
        console.log("No stock records found.");
      }
    } catch (error) {
      console.error("Failed to load stock:", error?.response?.data || error);
      // throw new Error("Could not load stock records");
    }
  }
}
