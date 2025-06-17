import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';

export type VisitDocument = HydratedDocument<Visit>;

@Schema()
export class Visit extends Document {
  @Prop({ required: true })
  id: number;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);