import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ConceptNameDocument= HydratedDocument<ConceptName>;
@Schema()
export class ConceptName{

    @Prop()
    concept_id: number;

    @Prop()
    concept_name_id: number;

    @Prop()
    name: string;
}

export const ConceptNameSchema = SchemaFactory.createForClass(ConceptName);