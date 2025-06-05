import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Diagnosis, DiagnosisSchema } from './schema/diagnosis.schema';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';



@Module({
  imports: [
    MongooseModule.forFeature([{ name: Diagnosis.name, schema: DiagnosisSchema }]),
    HttpModule,
    AuthModule
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService], 
})
export class DiagnosisModule {}
