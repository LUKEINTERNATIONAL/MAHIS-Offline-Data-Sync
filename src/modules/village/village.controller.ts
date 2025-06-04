import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { VillageService } from './village.service';
import { Village } from './schema/village.schema';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags("villages")
@Controller('api/v1/villages')
export class VillageController {
  constructor(private readonly villageService: VillageService) {}

  // @Post()
  // async create(@Body() body: Partial<Village>) {
  //   return this.villageService.create(body);
  // }

  @Get()
    @ApiOperation({ summary: "get all villages" })
    @ApiResponse({ status: 200, description: 'List all villages' })
  async findAll() {
    return this.villageService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
  //   return this.villageService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Village>) {
  //   return this.villageService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.villageService.delete(Number(id));
  // }
}
