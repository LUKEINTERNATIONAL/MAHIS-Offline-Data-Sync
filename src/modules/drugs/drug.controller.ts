import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { DrugService } from "./drug.service";
import { Drug } from "./schema/drug.schema";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags('drugs')
@Controller("drugs")
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Post()
  async create(@Body() body: Partial<Drug>) {
    return this.drugService.create(body);
  }

  @Get()
  @ApiOperation({ summary: "get all drugs" })
  @ApiResponse({ status: 200, description: "List all drugs" })
  async findAll() {
    return this.drugService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
  //   return this.drugService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Drug>) {
  //   return this.drugService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.drugService.delete(Number(id));
  // }
}
