import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FacilityDocument = HydratedDocument<Facility>;

@Schema({ timestamps: false }) // You’re manually managing created_at and updated_at
export class Facility {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  display_name?: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: [Number], default: [] })
  coordinates: number[];

  @Prop({ default: false })
  has_coordinates: boolean;

  @Prop()
  created_at: Date;

  @Prop()
  updated_at: Date;
}

export const FacilitySchema = SchemaFactory.createForClass(Facility);
