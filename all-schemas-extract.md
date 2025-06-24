# All TypeScript Schema Files Content
# Generated on Sat Jun 21 06:46:20 PM CAT 2025

## Module: conceptSet
**File:** `src/modules/conceptSet/schema/concept-set.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type ConceptSetDocument = HydratedDocument<ConceptSet>;

@Schema()
export class ConceptSet {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  concept_set_name: string;

  @Prop({ type: [Number], default: [] })
  member_ids: number[];
}

export const ConceptSetSchema = SchemaFactory.createForClass(ConceptSet);


setToJSON(ConceptSetSchema)```

---

## Module: country
**File:** `src/modules/country/schema/country.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type CountryDocument = HydratedDocument<Country>;

@Schema()
export class Country {
  @Prop({ required: true })
  district_id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  region_id: number;

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

export const CountrySchema = SchemaFactory.createForClass(Country);
setToJSON(CountrySchema)```

---

## Module: diagnosis
**File:** `src/modules/diagnosis/schema/diagnosis.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type DiagnosisDocument = HydratedDocument<Diagnosis>;

@Schema({ timestamps: false }) // `date_created` is manually managed
export class Diagnosis {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop()
  concept_name_id: number;

  @Prop()
  concept_name_type: string;

  @Prop()
  creator: number;

  @Prop()
  date_created: Date;

  @Prop()
  date_voided?: Date;

  @Prop()
  locale: string;

  @Prop()
  locale_preferred: boolean;

  @Prop()
  name: string;

  @Prop()
  uuid: string;

  @Prop()
  void_reason?: string;

  @Prop({ default: false })
  voided: boolean;

  @Prop()
  voided_by?: number;
}

export const DiagnosisSchema = SchemaFactory.createForClass(Diagnosis);
setToJSON(DiagnosisSchema)```

---

## Module: drugs
**File:** `src/modules/drugs/schema/drug.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type DrugDocument = HydratedDocument<Drug>;

@Schema({ timestamps: false }) // `date_created` is manually managed
export class Drug {
  @Prop({ required: true, unique: true })
  drug_id: number;

  @Prop()
  concept_id: number;

  @Prop()
  concept_name_id: number;

  @Prop()
  concept_name_type: string;

  @Prop()
  creator: number;

  @Prop()
  date_created: Date;

  @Prop()
  date_voided?: Date;

  @Prop()
  locale: string;

  @Prop()
  locale_preferred: boolean;

  @Prop()
  name: string;

  @Prop()
  uuid: string;

  @Prop()
  void_reason?: string;

  @Prop({ default: false })
  voided: boolean;

  @Prop()
  voided_by?: number;
}

export const DrugSchema = SchemaFactory.createForClass(Drug);
setToJSON(DrugSchema)```

---

## Module: facilities
**File:** `src/modules/facilities/schema/facility.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

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
setToJSON(FacilitySchema)```

---

## Module: patient
**File:** `src/modules/patient/schema/patient.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';
import { Types } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({
  timestamps: true,
  collection: 'patients'
})
export class Patient extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any; // Can store any JSON object

  @Prop({ type: Number })
  timestamp: number;

  @Prop({
    required: true,
    unique: true,
    sparse: true,
    index: true
  })
  patientID: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);```

---

## Module: programs
**File:** `src/modules/programs/schema/program.schema.ts`

```typescript
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

setToJSON(ProgramSchema)```

---

## Module: relationship
**File:** `src/modules/relationship/schema/relationship.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type RelationshipDocument = HydratedDocument<Relationship>;

@Schema()
export class Relationship {
  @Prop({ required: true, unique: true })
  relationship_type_id: number;

  @Prop({ required: true })
  a_is_to_b: string;

  @Prop({ required: true })
  b_is_to_a: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  preferred: boolean;

  @Prop()
  weight?: number;

  @Prop({ required: true })
  creator: number;

  @Prop({ required: true })
  date_created: Date;

  @Prop()
  date_retired?: Date;

  @Prop({ default: false })
  retired: boolean;

  @Prop()
  retire_reason?: string;

  @Prop()
  retired_by?: number;

  @Prop({ required: true, unique: true })
  uuid: string;
}

export const RelationshipSchema = SchemaFactory.createForClass(Relationship);
setToJSON(RelationshipSchema)```

---

## Module: serverPatientCount
**File:** `src/modules/serverPatientCount/schema/server-patient-count.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServerPatientCountDocument = ServerPatientCount & Document;

@Schema()
export class ServerPatientCount {
  @Prop({ required: true })
  id: number;
  
  @Prop({ required: true, type: Number })
  server_patient_count: number;
}

export const ServerPatientCountSchema = SchemaFactory.createForClass(ServerPatientCount);```

---

## Module: specimen
**File:** `src/modules/specimen/schema/specimen.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type SpecimenDocument = HydratedDocument<Specimen>;

@Schema()
export class Specimen {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop()
  name: string;
}

export const specimenSchema = SchemaFactory.createForClass(Specimen);
setToJSON(specimenSchema)```

---

## Module: stage
**File:** `src/modules/stage/schema/stage.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';

export type StageDocument = HydratedDocument<Stage>;

@Schema()
export class Stage extends Document {
  @Prop({ required: true })
  id: number;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;
}

export const StageSchema = SchemaFactory.createForClass(Stage);```

---

## Module: stock
**File:** `src/modules/stock/schema/stock.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

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
setToJSON(StockSchema)```

---

## Module: testResultIndicator
**File:** `src/modules/testResultIndicator/schema/test-result-indicator.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type TestResultIndicatorDocument = HydratedDocument<TestResultIndicator>;

@Schema()
export class TestResultIndicator {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop({ required: true })
  test_type_id: number;

  @Prop()
  name: string;
}

export const TestResultIndicatorSchema = SchemaFactory.createForClass(TestResultIndicator);
setToJSON(TestResultIndicatorSchema)```

---

## Module: testTypes
**File:** `src/modules/testTypes/schema/test-type.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

export type TestTypeDocument = HydratedDocument<TestType>;

@Schema()
export class TestType {
  @Prop({ required: true, unique: true })
  concept_id: number;

  @Prop()
  concept_set?: number;

  @Prop({ default: null })
  concept_set_id?: number | null;

  @Prop({ required: true })
  name: string;
}

export const TestTypeSchema = SchemaFactory.createForClass(TestType);
setToJSON(TestTypeSchema)
```

---

## Module: traditionalAuthority
**File:** `src/modules/traditionalAuthority/schema/traditional-authority.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { setToJSON } from '../../../utils/db/mongo';

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
setToJSON(TraditionalAuthoritySchema)```

---

## Module: user
**File:** `src/modules/user/schema/user.schema.ts`

```typescript
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

export const UserSchema = SchemaFactory.createForClass(User);```

---

## Module: village
**File:** `src/modules/village/schema/village.schema.ts`

```typescript
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

setToJSON(VillageSchema)```

---

## Module: visit
**File:** `src/modules/visit/schema/visit.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';

export type VisitDocument = HydratedDocument<Visit>;

@Schema()
export class Visit extends Document {
  @Prop({ required: true })
  id: number;
  
  @Prop({ type: MongooseSchema.Types.Mixed })
  data: any;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);```

---

## Module: wards
**File:** `src/modules/wards/schema/ward.schema.ts`

```typescript
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
setToJSON(WardSchema)```

---

