import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Diagnosis, DiagnosisSchema } from './schema/diagnosis.schema';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: Diagnosis.name, schema: DiagnosisSchema }]),
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
//   exports: [ConceptNameService], 
})
export class DiagnosisModule {}
