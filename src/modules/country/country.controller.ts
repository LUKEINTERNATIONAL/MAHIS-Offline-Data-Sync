import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { CountryService } from "./country.service";
import { Country } from "./schema/country.schema";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("countries")
@Controller("countries")
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  // @Post()
  // async create(@Body() body: Partial<Country>) {
  //   return this.countryService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all countries" })
  @ApiResponse({ status: 200, description: "List all countries" })
  async findAll() {
    return this.countryService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
  //   return this.countryService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Country>) {
  //   return this.countryService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.countryService.delete(Number(id));
  // }
}
