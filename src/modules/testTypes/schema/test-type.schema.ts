import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestTypeDocument = HydratedDocument<TestType>;

@Schema()
export class TestType {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop()
  concept_set?: number;

  @Prop({ default: null })
  concept_set_id?: number | null;

  @Prop({ required: true })
  name: string;
}

export const TestTypeSchema = SchemaFactory.createForClass(TestType);
