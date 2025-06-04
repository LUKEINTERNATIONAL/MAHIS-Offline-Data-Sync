import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { SpecimenService } from './specimen.service';
import { Specimen } from './schema/specimen.schema';


@Controller('api/v1/specimens')
export class SpecimenController {
  constructor(private readonly specimenService: SpecimenService) {}

  @Post()
  async create(@Body() body: Partial<Specimen>) {
    return this.specimenService.create(body);
  }

  @Get()
  async findAll() {
    return this.specimenService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.specimenService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Specimen>) {
    return this.specimenService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.specimenService.delete(Number(id));
  }
}
