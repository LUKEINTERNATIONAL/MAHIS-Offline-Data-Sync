import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { Diagnosis } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Diagnosis')
@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  // @Post()
  // async create(@Body() body: Partial<Diagnosis>) {
  //   return this.diagnosisService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all diagnosis' })
  @ApiResponse({ status: 200, description: 'List all diagnosis' })
  async findAll(): Promise<Diagnosis[]> {
    return this.diagnosisService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<Diagnosis | null> {
  //   return this.diagnosisService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Diagnosis>) {
  //   return this.diagnosisService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.diagnosisService.delete(Number(id));
  // }
}
