import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { ProgramService } from './program.service';
import { Program } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Programs')
@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // @Post()
  // async create(@Body() body: Partial<Program>) {
  //   return this.programService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all programs' })
  @ApiResponse({ status: 200, description: 'List all programs' })
  async findAll(): Promise<Program[]> {
    return this.programService.findAll();
  }

  // Add other endpoints as needed...
}
