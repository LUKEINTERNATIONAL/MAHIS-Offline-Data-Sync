import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';

export type StageDocument = HydratedDocument<Stage>;

@Schema()
export class Stage extends Document {
  @Prop({ required: true })
  id: number;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;
}

export const StageSchema = SchemaFactory.createForClass(Stage);