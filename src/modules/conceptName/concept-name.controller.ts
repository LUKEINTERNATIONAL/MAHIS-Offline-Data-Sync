import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ConceptNameService } from './concept-name.service';
import { ConceptName } from './schemas/concept-name.schema';

@Controller('concept-names')
export class ConceptNameController {
  constructor(private readonly conceptNameService: ConceptNameService) {}

  @Post()
  async create(@Body() conceptNameDto: Partial<ConceptName>): Promise<ConceptName> {
    return this.conceptNameService.create(conceptNameDto);
  }

  @Get()
  async findAll(): Promise<ConceptName[]> {
    return this.conceptNameService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ConceptName | null> {
    return this.conceptNameService.findById(Number(id));
  }
}
