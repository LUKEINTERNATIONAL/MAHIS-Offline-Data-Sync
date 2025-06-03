import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Relationship, RelationshipSchema } from './schema/relationship.schema';
import { RelationshipController } from './relationshio.controller';
import { RelationshipService } from './relationship.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Relationship.name, schema: RelationshipSchema }]),
    HttpModule
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
  exports: [RelationshipService], 
})
export class RelationshipModule {}
