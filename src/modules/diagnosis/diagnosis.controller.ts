import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { DiagnosisService } from "./diagnosis.service";
import { Diagnosis } from "./schema/diagnosis.schema";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("diagnoses")
@Controller("diagnoses")
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post()
  async create(@Body() body: Partial<Diagnosis>) {
    return this.diagnosisService.create(body);
  }

  @Get()
  @ApiOperation({ summary: "get all concept sets" })
  @ApiResponse({ status: 200, description: "List all concept sets" })
  async findAll() {
    return this.diagnosisService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string) {
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
