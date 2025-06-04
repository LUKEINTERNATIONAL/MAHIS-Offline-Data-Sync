import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './schema/stock.schema';


@Controller('api/v1/stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  async create(@Body() body: Partial<Stock>) {
    return this.stockService.create(body);
  }

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.stockService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Stock>) {
    return this.stockService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.stockService.delete(Number(id));
  }
}
