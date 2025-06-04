import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestResultIndicatorDocument = HydratedDocument<TestResultIndicator>;

@Schema()
export class TestResultIndicator {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop({ required: true })
  test_type_id: number;

  @Prop()
  name: string;
}

export const TestResultIndicatorSchema = SchemaFactory.createForClass(TestResultIndicator);
