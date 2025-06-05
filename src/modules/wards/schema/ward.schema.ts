import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type WardDocument = HydratedDocument<Ward>;

@Schema()
export class Ward {
  @Prop({ required: true, unique: true })
  location_id: number;

  @Prop()
  uuid: string;

  @Prop({ default: '' })
  address1: string;

  @Prop({ default: '' })
  address2: string;

  @Prop({ default: '' })
  city_village: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ type: Number, default: null })
  county_district: number | null;

  @Prop({ required: true })
  creator: number;

  @Prop({ required: true })
  date_created: Date;

  @Prop({ type: Date, default: null })
  date_retired: Date | null;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  district: string;

  @Prop({ default: '' })
  latitude: string;

  @Prop({ type: Number, default: null })
  location_type_id: number | null;

  @Prop({ default: '' })
  longitude: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: null })
  neighborhood_cell: number | null;

  @Prop({ type: Number, default: null })
  parent_location: number | null;

  @Prop({ default: '' })
  postal_code: string;

  @Prop({ type: Number, default: null })
  region: number | null;

  @Prop({ type: String, default: null })
  retire_reason: string | null;

  @Prop({ default: false })
  retired: boolean;

  @Prop({ type: Number, default: null })
  retired_by: number | null;

  @Prop({ default: '' })
  state_province: string;

  @Prop({ type: Number, default: null })
  subregion: number | null;

  @Prop({ type: Number, default: null })
  township_division: number | null;
}

export const WardSchema = SchemaFactory.createForClass(Ward);
setToJSON(WardSchema)