import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schema/patient.schema';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
  ],
  controllers: [PatientController],
  providers: [PatientService],
//   exports: [ConceptNameService], 
})
export class PatientModule {}
