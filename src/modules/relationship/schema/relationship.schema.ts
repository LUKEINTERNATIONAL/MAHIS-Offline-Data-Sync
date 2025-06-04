import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RelationshipDocument = HydratedDocument<Relationship>;

@Schema()
export class Relationship {
  @Prop({ required: true, unique: true })
  relationship_type_id: number;

  @Prop({ required: true })
  a_is_to_b: string;

  @Prop({ required: true })
  b_is_to_a: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  preferred: boolean;

  @Prop()
  weight?: number;

  @Prop({ required: true })
  creator: number;

  @Prop({ required: true })
  date_created: Date;

  @Prop()
  date_retired?: Date;

  @Prop({ default: false })
  retired: boolean;

  @Prop()
  retire_reason?: string;

  @Prop()
  retired_by?: number;

  @Prop({ required: true, unique: true })
  uuid: string;
}

export const RelationshipSchema = SchemaFactory.createForClass(Relationship);
