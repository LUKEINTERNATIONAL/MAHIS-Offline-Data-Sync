import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { FacilityService } from "./facilities.service";
import { Facility } from "./schema/facility.schema";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("facilities")
@Controller("facilities")
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  // @Post()
  // async create(@Body() body: Partial<Facility>) {
  //   return this.facilityService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all facilities" })
  @ApiResponse({ status: 200, description: "List all facilities" })
  async findAll() {
    return this.facilityService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
  //   return this.facilityService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Facility>) {
  //   return this.facilityService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.facilityService.delete(Number(id));
  // }
}
