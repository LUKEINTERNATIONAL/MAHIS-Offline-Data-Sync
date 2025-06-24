import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { CountryService } from './country.service';
import { Country } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Countries')
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  // @Post()
  // async create(@Body() body: Partial<Country>) {
  //   return this.countryService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({ status: 200, description: 'List all countries' })
  async findAll(): Promise<Country[]> {
    return this.countryService.findAll();
  }

  // Add other endpoints as needed...
}
