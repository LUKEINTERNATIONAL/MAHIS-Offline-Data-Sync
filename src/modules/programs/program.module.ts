import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Program, ProgramSchema } from './schema/program.schema';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Program.name, schema: ProgramSchema }]),
    HttpModule
  ],
  controllers: [ProgramController],
  providers: [ProgramService],
//   exports: [ConceptNameService], 
})
export class ProgramModule {}
