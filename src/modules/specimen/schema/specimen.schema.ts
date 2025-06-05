import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type SpecimenDocument = HydratedDocument<Specimen>;

@Schema()
export class Specimen {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop()
  name: string;
}

export const specimenSchema = SchemaFactory.createForClass(Specimen);
setToJSON(specimenSchema)