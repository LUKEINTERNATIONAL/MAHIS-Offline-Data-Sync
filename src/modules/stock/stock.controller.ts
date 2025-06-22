import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // @Post()
  // async create(@Body() body: Partial<Stock>) {
  //   return this.stockService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all stock' })
  @ApiResponse({ status: 200, description: 'List all stock' })
  async findAll(): Promise<Stock[]> {
    return this.stockService.findAll();
  }

  // Add other endpoints as needed...
}


