import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema()
export class Stock {
  @Prop({ required: true, unique: true })
  pharmacy_batch_id: number;

  @Prop()
  barcode?: string;

  @Prop()
  batch_number: string;

  @Prop({ required: true })
  drug_id: number;

  @Prop()
  drug_legacy_name?: string;

  @Prop()
  drug_name?: string;

  @Prop()
  product_code?: string;

  @Prop()
  manufacture?: string;

  @Prop()
  dosage_form?: string;

  @Prop()
  unit_doses?: number;

  @Prop()
  pack_size?: number;

  @Prop()
  expiry_date: string;

  @Prop()
  delivery_date: string;

  @Prop({ default: 0 })
  delivered_quantity: number;

  @Prop({ default: 0 })
  dispensed_quantity: number;

  @Prop({ default: 0 })
  doses_wasted: number;

  @Prop({ default: 0 })
  current_quantity: number;

  @Prop()
  total_count?: number;

  @Prop({ required: true })
  creator: number;

  @Prop()
  changed_by?: number;

  @Prop({ required: true })
  date_created: Date;

  @Prop()
  date_changed?: Date;

  @Prop()
  latest_date_changed?: Date;

  @Prop({ default: false })
  voided: boolean;

  @Prop()
  void_reason?: string;

  @Prop()
  date_voided?: Date;

  @Prop()
  voided_by?: number;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
