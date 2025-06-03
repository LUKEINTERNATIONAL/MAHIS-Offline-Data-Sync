import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptSet, ConceptSetSchema } from './schema/concept-set.schema';
import { ConceptSetService } from './concept-set.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AuthService } from '../../app.authService';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConceptSet.name, schema: ConceptSetSchema}]),
    HttpModule
  ],
  providers: [ConceptSetService,],
  exports: [ConceptSetService],
})
export class ConceptSetModule {}
