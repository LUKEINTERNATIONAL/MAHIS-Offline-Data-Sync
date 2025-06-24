import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ConceptNameService } from './concept-name.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConceptName } from '@prisma/client'; // <-- Use this if you have Prisma

@ApiTags('Concept Names')
@Controller('concept-names')
export class ConceptNameController {
  constructor(private readonly conceptNameService: ConceptNameService) {}

  // @Post()
  // async create(@Body() conceptNameDto: Partial<ConceptName>): Promise<ConceptName> {
  //   return this.conceptNameService.create(conceptNameDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Get all concept names' })
  @ApiResponse({ status: 200, description: 'List of stock items' })
  async findAll(): Promise<ConceptName[]> {
    return this.conceptNameService.findAll();
  }

  // @Get(':id')
  // async findById(@Param('id') id: string): Promise<ConceptName | null> {
  //   return this.conceptNameService.findById(Number(id));
  // }
}
