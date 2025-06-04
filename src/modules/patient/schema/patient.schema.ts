import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({
  timestamps: true,
  collection: 'patients'
})
export class Patient {
  @Prop({ required: true })
  message: string;

  @Prop({ type: String })
  data: string;

  @Prop({ type: Number })
  timestamp: number;

  // Keep patientID as unique but not the primary key for operations
  @Prop({ 
    required: true,
    unique: true, 
    sparse: true,
    index: true 
  })
  patientID: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
