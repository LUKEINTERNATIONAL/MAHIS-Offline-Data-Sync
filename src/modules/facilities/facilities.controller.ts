import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { FacilitiesService } from "./facilities.service";
import { Facility } from "@prisma/client";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("facilities")
@Controller("facilities")
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  // @Post()
  // async create(@Body() body: Partial<Facility>) {
  //   return this.facilitiesService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all facilities" })
  @ApiResponse({ status: 200, description: "List all facilities" })
  async findAll(): Promise<Facility[]> {
    return this.facilitiesService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<Facility | null> {
  //   return this.facilitiesService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Facility>): Promise<Facility | null> {
  //   return this.facilitiesService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string): Promise<Facility | null> {
  //   return this.facilitiesService.delete(Number(id));
  // }
}
