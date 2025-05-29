import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Relationship, RelationshipSchema } from './schema/relationship.schema';
import { RelationshipController } from './relationshio.controller';
import { RelationshipService } from './relationship.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Relationship.name, schema: RelationshipSchema }]),
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService],
//   exports: [ConceptNameService], 
})
export class RelationshipModule {}
