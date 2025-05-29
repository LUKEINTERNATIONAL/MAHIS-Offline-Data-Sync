import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { TestType } from './schema/test-type.schema';
import { TestTypeService } from './test-type.service';



@Controller('api/v1/test-types')
export class TestTypeController {
  constructor(private readonly testTypeService: TestTypeService) {}

  @Post()
  async create(@Body() body: Partial<TestType>) {
    return this.testTypeService.create(body);
  }

  @Get()
  async findAll() {
    return this.testTypeService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testTypeService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<TestType>) {
    return this.testTypeService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.testTypeService.delete(Number(id));
  }
}
