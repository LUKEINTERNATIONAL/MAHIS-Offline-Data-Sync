import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema } from "mongoose";

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ _id: false })
class BirthRegistration {
  @Prop({ required: true })
  concept_id: number;

  @Prop({ required: true })
  concept_name: string;

  @Prop({ required: true })
  obs_datetime: string;
}

@Schema({ _id: false })
class PersonInformation {
  @Prop()
  birthdate: string;

  @Prop()
  birthdate_estimated: string;

  @Prop()
  cell_phone_number: string;

  @Prop()
  country: string;

  @Prop()
  current_district: string;

  @Prop()
  current_region: string;

  @Prop()
  current_traditional_authority: string;

  @Prop()
  current_village: string;

  @Prop()
  education_level: string;

  @Prop()
  family_name: string;

  @Prop()
  gender: string;

  @Prop()
  given_name: string;

  @Prop()
  home_district: string;

  @Prop()
  home_region: string;

  @Prop()
  home_traditional_authority: string;

  @Prop()
  home_village: string;

  @Prop()
  landmark: string;

  @Prop()
  marital_status: string;

  @Prop()
  middle_name: string;

  @Prop()
  occupation: string;

  @Prop()
  religion: string;
}

@Schema({ _id: false })
class Observation {
  @Prop()
  children: any[];

  @Prop()
  concept_id: number;

  @Prop()
  concept_name: string;

  @Prop()
  obs_datetime: string;

  @Prop()
  obs_id: number;

  @Prop()
  value_coded: string;

  @Prop()
  value_numeric: number;

  @Prop()
  value_text: string;
}

@Schema({ _id: false })
class Encounter {
  @Prop({ type: [Observation], default: [] })
  saved: Observation[];

  @Prop({ type: [Observation], default: [] })
  unsaved: Observation[];
}

@Schema({ timestamps: false })
export class Patient {
  @Prop({ required: true, unique: true })
  ID: string;

  @Prop()
  NcdID: string;

  @Prop({ type: [BirthRegistration] })
  birthRegistration: BirthRegistration[];

  @Prop()
  location_id: string;

  @Prop()
  patientID: string;

  @Prop()
  program_id: string;

  @Prop()
  provider_id: string;

  @Prop()
  saveStatusBirthRegistration: string;

  @Prop()
  saveStatusGuardianInformation: string;

  @Prop()
  saveStatusPersonInformation: string;

  @Prop({ type: PersonInformation })
  personInformation: PersonInformation;

  @Prop({
    type: Map,
    of: SchemaFactory.createForClass(Encounter),
    default: {},
  })
  encounters: Record<string, Encounter>;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
