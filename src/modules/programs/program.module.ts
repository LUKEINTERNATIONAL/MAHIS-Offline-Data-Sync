import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Program, ProgramSchema } from './schema/program.schema';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
  ],
  controllers: [ProgramController],
  providers: [ProgramService],
//   exports: [ConceptNameService], 
})
export class ProgramModule {}
