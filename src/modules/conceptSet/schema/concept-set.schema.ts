import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConceptSetDocument = HydratedDocument<ConceptSet>;

@Schema()
export class ConceptSet {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  concept_set_name: string;

  @Prop({ type: [Number], default: [] })
  member_ids: number[];
}

export const ConceptSetSchema = SchemaFactory.createForClass(ConceptSet);
