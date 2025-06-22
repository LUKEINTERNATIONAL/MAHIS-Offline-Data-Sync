import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { TestType } from '@prisma/client';
import { TestTypeService } from './test-type.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';



@ApiTags("test type")
@Controller('test-types')
export class TestTypeController {
  constructor(private readonly testTypeService: TestTypeService) {}

  // @Post()
  // async create(@Body() body: Partial<TestType>) {
  //   return this.testTypeService.create(body);
  // }

  @Get()
    @ApiOperation({ summary: "get all test types" })
    @ApiResponse({ status: 200, description: 'List all test types' })
  async findAll(): Promise<TestType[]> {
    return this.testTypeService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<TestType | null> {
  //   return this.testTypeService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<TestType>) {
  //   return this.testTypeService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.testTypeService.delete(Number(id));
  // }
}
