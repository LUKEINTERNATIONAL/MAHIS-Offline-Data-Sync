import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { TraditionalAuthority } from '@prisma/client'; // Use Prisma type

import { TraditionalAuthorityService } from './traditional-authority.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags("traditional authorities")
@Controller('traditional-authorities')
export class TraditionalAuthorityController {
  constructor(private readonly TraditionalAuthorityService: TraditionalAuthorityService) {}

  // @Post()
  // async create(@Body() body: Partial<TraditionalAuthority>) {
  //   return this.TraditionalAuthorityService.create(body);
  // }

  @Get()
    @ApiOperation({ summary: "get all traditional authority" })
    @ApiResponse({ status: 200, description: 'List all traditional authority' })
    async findAll(): Promise<TraditionalAuthority[]> {
      return this.TraditionalAuthorityService.findAll();
    }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<TraditionalAuthority | null> {
  //   return this.TraditionalAuthorityService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<TraditionalAuthority>) {
  //   return this.TraditionalAuthorityService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.TraditionalAuthorityService.delete(Number(id));
  // }
}
