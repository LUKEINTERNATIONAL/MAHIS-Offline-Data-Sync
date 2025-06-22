import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { Relationship } from '@prisma/client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';



@ApiTags('Relationships')
@Controller('relationships')
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  // @Post()
  // async create(@Body() body: Partial<Relationship>) {
  //   return this.relationshipService.create(body);
  // }

  @Get()
    @ApiOperation({ summary: 'Get all relationships' })
    @ApiResponse({ status: 200, description: 'List all relationships' })
  async findAll(): Promise<Relationship[]> {
    return this.relationshipService.findAll();
  }
}
