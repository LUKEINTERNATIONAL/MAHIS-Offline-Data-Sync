import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptName, ConceptNameSchema } from './schemas/concept-name.schema';
import { ConceptNameController } from './concept-name.controller';
import { ConceptNameService } from './concept-name.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConceptName.name, schema: ConceptNameSchema }]),
    HttpModule
  ],
  controllers: [ConceptNameController],
  providers: [ConceptNameService],
  exports: [ConceptNameService], 
})
export class ConceptNameModule {}
