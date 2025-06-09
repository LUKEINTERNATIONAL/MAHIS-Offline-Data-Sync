import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';
import { Types } from 'mongoose';

export type DDEDocument = HydratedDocument<DDE>;

// Define the status enum for type safety
export enum DDEStatus {
  PENDING = 'pending',
  COMPLETED = 'completed'
}

@Schema({
  timestamps: true,
  collection: 'dde'
})
export class DDE extends Document {
  _id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any; // Can store any JSON object

  @Prop({
    required: true,
    unique: true,
    sparse: true,
    index: true
  })
  npid: string;
  

  @Prop({
    type: String,
    enum: Object.values(DDEStatus),
    default: null // Set to null initially as requested
  })
  status: DDEStatus | null;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const DDESchema = SchemaFactory.createForClass(DDE);