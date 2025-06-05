import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';
import { Types } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({
  timestamps: true,
  collection: 'patients'
})
export class Patient extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any; // Can store any JSON object

  @Prop({ type: Number })
  timestamp: number;

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