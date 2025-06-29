import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { SpecimenService } from "./specimen.service";
import { Specimen } from "@prisma/client";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("specimens")
@Controller("specimens")
export class SpecimenController {
  constructor(private readonly specimenService: SpecimenService) {}

  // @Post()
  // async create(@Body() body: Partial<Specimen>) {
  //   return this.specimenService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all specimens" })
  @ApiResponse({ status: 200, description: "List all specimens" })
  async findAll(): Promise<Specimen[]> {
    return this.specimenService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<Specimen | null> {
  //   return this.specimenService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Specimen>): Promise<Specimen | null> {
  //   return this.specimenService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string): Promise<Specimen | null> {
  //   return this.specimenService.delete(Number(id));
  // }
}
