import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptSet, ConceptSetSchema } from './schema/concept-set.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConceptSet.name, schema: ConceptSetSchema}]),
  ],
//   controllers: [ConceptNameController],
//   providers: [ConceptNameService],
//   exports: [ConceptNameService], 
})
export class ConceptSetModule {}
