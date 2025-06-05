import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type ProgramDocument = HydratedDocument<Program>;

@Schema()
export class Program {
  @Prop({ required: true, unique: true })
  program_id: number;

  @Prop({ required: true })
  concept_id: number;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  creator: number;

  @Prop()
  changed_by?: number;

  @Prop()
  date_created: Date;

  @Prop()
  date_changed?: Date;

  @Prop({ default: false })
  retired: boolean;

  @Prop({ required: true, unique: true })
  uuid: string;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);

setToJSON(ProgramSchema)