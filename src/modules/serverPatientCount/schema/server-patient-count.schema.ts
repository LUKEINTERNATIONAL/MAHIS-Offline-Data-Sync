import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServerPatientCountDocument = ServerPatientCount & Document;

@Schema()
export class ServerPatientCount {
  @Prop({ required: true })
  id: number;
  
  @Prop({ required: true, type: Number })
  server_patient_count: number;
}

export const ServerPatientCountSchema = SchemaFactory.createForClass(ServerPatientCount);