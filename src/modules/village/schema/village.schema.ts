import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type VillageDocument = HydratedDocument<Village>;

@Schema()
export class Village {
  @Prop({ required: true, unique: true })
  village_id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  traditional_authority_id: number;
 
  @Prop({ required: true })
  date_created: Date;
}

export const VillageSchema = SchemaFactory.createForClass(Village);

setToJSON(VillageSchema)