import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true, type: String }) // Changed from Number to String
  locationId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);