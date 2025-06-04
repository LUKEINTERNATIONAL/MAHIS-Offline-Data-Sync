import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';

import { TestResultIndicator } from './schema/test-result-indicator.schema';
import { TestResultIndicatorService } from './res-result-indicator.service';


@Controller('api/v1/test-result-indicators')
export class TestResultIndicatorController {
  constructor(private readonly testResultIndicatorService: TestResultIndicatorService) {}

  @Post()
  async create(@Body() body: Partial<TestResultIndicator>) {
    return this.testResultIndicatorService.create(body);
  }

  @Get()
  async findAll() {
    return this.testResultIndicatorService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testResultIndicatorService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<TestResultIndicator>) {
    return this.testResultIndicatorService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.testResultIndicatorService.delete(Number(id));
  }
}
