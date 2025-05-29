import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TraditionalAuthorityDocument = HydratedDocument<TraditionalAuthority>;

@Schema()
export class TraditionalAuthority {
  @Prop({ required: true })
  traditional_authority_id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  district_id: number;

  @Prop({ required: true })
  creator: number;

  @Prop({ required: true })
  date_created: Date;

  @Prop({ type: Date, default: null })
  date_retired: Date | null;

  @Prop({ type: String, default: null })
  retire_reason: string | null;

  @Prop({ default: false })
  retired: boolean;

  @Prop({ type: Number, default: null })
  retired_by: number | null;
}

export const TraditionalAuthoritySchema = SchemaFactory.createForClass(TraditionalAuthority);
