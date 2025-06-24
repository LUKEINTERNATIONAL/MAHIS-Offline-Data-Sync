import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { ConceptSetService } from "./concept-set.service";
import { ConceptSet } from "@prisma/client";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Concept Sets")
@Controller("concept-sets")
export class ConceptSetController {
  constructor(private readonly conceptSetService: ConceptSetService) {}

  // @Post()
  // async create(@Body() body: Partial<ConceptSet>) {
  //   return this.conceptSetService.create(body);
  // }

  @Get()
  @ApiOperation({ summary: "get all concept sets" })
  @ApiResponse({ status: 200, description: 'List all concept sets' })
  async findAll(): Promise<ConceptSet[]> {
    return this.conceptSetService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<ConceptSet | null> {
  //   return this.conceptSetService.findById(Number(id));
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() body: Partial<ConceptSet>) {
  //   return this.conceptSetService.update(Number(id), body);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string) {
  //   return this.conceptSetService.delete(Number(id));
  // }
}
