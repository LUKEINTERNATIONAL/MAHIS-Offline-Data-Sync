import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { ProgramService } from "./program.service";
import { Program } from "./schema/program.schema";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("programs")
@Controller("programs")
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // @Post()
  // async create(@Body() body: Partial<Program>) {
  //   return this.programService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all programs" })
  @ApiResponse({ status: 200, description: "List all programs" })
  async findAll() {
    return this.programService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
  //   return this.programService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<Program>) {
  //   return this.programService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.programService.delete(Number(id));
  // }
}
