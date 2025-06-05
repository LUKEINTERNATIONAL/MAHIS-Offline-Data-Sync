import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Specimen, specimenSchema } from './schema/specimen.schema';
import { HttpModule } from '@nestjs/axios';
import { SpecimenController } from './specimen.controller';
import { SpecimenService } from './specimen.service';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Specimen.name, schema: specimenSchema }]),
    HttpModule,
    AuthModule
  ],
  controllers: [SpecimenController],
  providers: [SpecimenService],
  exports: [SpecimenService], 
})
export class SpecimenModule {}
