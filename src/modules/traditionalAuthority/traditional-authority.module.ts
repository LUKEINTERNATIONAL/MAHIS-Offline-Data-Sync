import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TraditionalAuthority, TraditionalAuthoritySchema } from './schema/traditional-authority.schema';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: TraditionalAuthority.name, schema: TraditionalAuthoritySchema }]),
  ],
//   controllers: [ConceptNameController],
//   providers: [ConceptNameService],
//   exports: [ConceptNameService], 
})
export class TraditionalAuthorityModule {}
