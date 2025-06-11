import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServerPatientCountSchema, ServerPatientCount } from './schema/server-patient-count.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServerPatientCount.name, schema: ServerPatientCountSchema }])
  ],
  exports: [MongooseModule]
})
export class ServerPatientCountModule {}