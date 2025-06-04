import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { WardService } from './ward.service';
import { Ward } from './schema/ward.schema';


@Controller('api/v1/wards')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Post()
  async create(@Body() body: Partial<Ward>) {
    return this.wardService.create(body);
  }

  @Get()
  async findAll() {
    return this.wardService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.wardService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Ward>) {
    return this.wardService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.wardService.delete(Number(id));
  }
}
