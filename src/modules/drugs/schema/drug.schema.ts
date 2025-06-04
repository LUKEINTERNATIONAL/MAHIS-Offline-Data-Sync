import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type DrugDocument = HydratedDocument<Drug>;

@Schema({ timestamps: false }) // `date_created` is manually managed
export class Drug {
  @Prop({ required: true, unique: true })
  drug_id: number;

  @Prop()
  concept_id: number;

  @Prop()
  concept_name_id: number;

  @Prop()
  concept_name_type: string;

  @Prop()
  creator: number;

  @Prop()
  date_created: Date;

  @Prop()
  date_voided?: Date;

  @Prop()
  locale: string;

  @Prop()
  locale_preferred: boolean;

  @Prop()
  name: string;

  @Prop()
  uuid: string;

  @Prop()
  void_reason?: string;

  @Prop({ default: false })
  voided: boolean;

  @Prop()
  voided_by?: number;
}

export const DrugSchema = SchemaFactory.createForClass(Drug);
setToJSON(DrugSchema)