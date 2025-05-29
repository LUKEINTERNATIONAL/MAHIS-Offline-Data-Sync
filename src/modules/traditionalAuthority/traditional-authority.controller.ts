import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { TraditionalAuthority } from './schema/traditional-authority.schema';

import { TraditionalAuthorityService } from './traditional-authority.service';



@Controller('api/v1/traditional-authorities')
export class TraditionalAuthorityController {
  constructor(private readonly TraditionalAuthorityService: TraditionalAuthorityService) {}

  @Post()
  async create(@Body() body: Partial<TraditionalAuthority>) {
    return this.TraditionalAuthorityService.create(body);
  }

  @Get()
  async findAll() {
    return this.TraditionalAuthorityService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.TraditionalAuthorityService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<TraditionalAuthority>) {
    return this.TraditionalAuthorityService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.TraditionalAuthorityService.delete(Number(id));
  }
}
