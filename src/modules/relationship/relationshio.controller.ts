import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { Relationship } from './schema/relationship.schema';


@Controller('api/v1/relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(@Body() body: Partial<Relationship>) {
    return this.relationshipService.create(body);
  }

  @Get()
  async findAll() {
    return this.relationshipService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.relationshipService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Relationship>) {
    return this.relationshipService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.relationshipService.delete(Number(id));
  }
}
