import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConceptSet, ConceptSetSchema } from './schema/concept-set.schema';
import { ConceptSetService } from './concept-set.service';
import { HttpModule, } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ConceptSet.name, schema: ConceptSetSchema}]),
    HttpModule,
    AuthModule
  ],
  providers: [ConceptSetService,],
  exports: [ConceptSetService],
})
export class ConceptSetModule {}
