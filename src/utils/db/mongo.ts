
import { Schema } from 'mongoose';

export function setToJSON(schema: Schema) {
  schema.set('toJSON', {
    virtuals: true, // optional: include virtuals
    versionKey: false, // removes __v
    transform: (_doc, ret) => {
      delete ret._id; // remove _id
      return ret;
    },
  });
}
