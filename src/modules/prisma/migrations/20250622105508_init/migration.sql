-- CreateTable
CREATE TABLE "conceptnames" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_name_id" INTEGER NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "concept_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_set_id" INTEGER NOT NULL,
    "concept_set_name" TEXT NOT NULL,
    "member_ids" JSONB NOT NULL DEFAULT []
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "district_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" INTEGER NOT NULL,
    "creator" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "date_retired" DATETIME,
    "retire_reason" TEXT,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "retired_by" INTEGER
);

-- CreateTable
CREATE TABLE "dde" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_id" INTEGER NOT NULL,
    "concept_name_id" INTEGER,
    "concept_name_type" TEXT,
    "creator" INTEGER,
    "date_created" DATETIME,
    "date_voided" DATETIME,
    "locale" TEXT,
    "locale_preferred" BOOLEAN,
    "name" TEXT,
    "uuid" TEXT,
    "void_reason" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "voided_by" INTEGER
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drug_id" INTEGER NOT NULL,
    "concept_id" INTEGER,
    "concept_name_id" INTEGER,
    "concept_name_type" TEXT,
    "creator" INTEGER,
    "date_created" DATETIME,
    "date_voided" DATETIME,
    "locale" TEXT,
    "locale_preferred" BOOLEAN,
    "name" TEXT,
    "uuid" TEXT,
    "void_reason" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "voided_by" INTEGER
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facility_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "district" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL DEFAULT [],
    "has_coordinates" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" INTEGER,
    "patientID" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "program_id" INTEGER NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creator" INTEGER,
    "changed_by" INTEGER,
    "date_created" DATETIME,
    "date_changed" DATETIME,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "uuid" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationship_type_id" INTEGER NOT NULL,
    "a_is_to_b" TEXT NOT NULL,
    "b_is_to_a" TEXT NOT NULL,
    "description" TEXT,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER,
    "creator" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "date_retired" DATETIME,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "retire_reason" TEXT,
    "retired_by" INTEGER,
    "uuid" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "server_patient_counts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "server_patient_count" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "specimens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_id" INTEGER NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage_id" INTEGER NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pharmacy_batch_id" INTEGER NOT NULL,
    "barcode" TEXT,
    "batch_number" TEXT,
    "drug_id" INTEGER NOT NULL,
    "drug_legacy_name" TEXT,
    "drug_name" TEXT,
    "product_code" TEXT,
    "manufacture" TEXT,
    "dosage_form" TEXT,
    "unit_doses" INTEGER,
    "pack_size" INTEGER,
    "expiry_date" TEXT,
    "delivery_date" TEXT,
    "delivered_quantity" INTEGER NOT NULL DEFAULT 0,
    "dispensed_quantity" INTEGER NOT NULL DEFAULT 0,
    "doses_wasted" INTEGER NOT NULL DEFAULT 0,
    "current_quantity" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER,
    "creator" INTEGER NOT NULL,
    "changed_by" INTEGER,
    "date_created" DATETIME NOT NULL,
    "date_changed" DATETIME,
    "latest_date_changed" DATETIME,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "void_reason" TEXT,
    "date_voided" DATETIME,
    "voided_by" INTEGER
);

-- CreateTable
CREATE TABLE "test_result_indicators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_id" INTEGER NOT NULL,
    "test_type_id" INTEGER NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "test_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "concept_id" INTEGER NOT NULL,
    "concept_set" INTEGER,
    "concept_set_id" INTEGER,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "traditional_authorities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traditional_authority_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "district_id" INTEGER NOT NULL,
    "creator" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "date_retired" DATETIME,
    "retire_reason" TEXT,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "retired_by" INTEGER
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "locationId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "villages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "village_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "traditional_authority_id" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" INTEGER NOT NULL,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "location_id" INTEGER NOT NULL,
    "uuid" TEXT,
    "address1" TEXT NOT NULL DEFAULT '',
    "address2" TEXT NOT NULL DEFAULT '',
    "city_village" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "county_district" INTEGER,
    "creator" INTEGER NOT NULL,
    "date_created" DATETIME NOT NULL,
    "date_retired" DATETIME,
    "description" TEXT NOT NULL DEFAULT '',
    "district" TEXT NOT NULL DEFAULT '',
    "latitude" TEXT NOT NULL DEFAULT '',
    "location_type_id" INTEGER,
    "longitude" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "neighborhood_cell" INTEGER,
    "parent_location" INTEGER,
    "postal_code" TEXT NOT NULL DEFAULT '',
    "region" INTEGER,
    "retire_reason" TEXT,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "retired_by" INTEGER,
    "state_province" TEXT NOT NULL DEFAULT '',
    "subregion" INTEGER,
    "township_division" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "conceptnames_concept_name_id_key" ON "conceptnames"("concept_name_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_sets_concept_set_id_key" ON "concept_sets"("concept_set_id");

-- CreateIndex
CREATE UNIQUE INDEX "dde_npid_key" ON "dde"("npid");

-- CreateIndex
CREATE UNIQUE INDEX "diagnoses_concept_id_key" ON "diagnoses"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "drugs_drug_id_key" ON "drugs"("drug_id");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_facility_id_key" ON "facilities"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_code_key" ON "facilities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientID_key" ON "patients"("patientID");

-- CreateIndex
CREATE UNIQUE INDEX "programs_program_id_key" ON "programs"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "programs_uuid_key" ON "programs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_relationship_type_id_key" ON "relationships"("relationship_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_uuid_key" ON "relationships"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "specimens_concept_id_key" ON "specimens"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "stages_stage_id_key" ON "stages"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_pharmacy_batch_id_key" ON "stocks"("pharmacy_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_result_indicators_concept_id_key" ON "test_result_indicators"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_types_concept_id_key" ON "test_types"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "traditional_authorities_traditional_authority_id_key" ON "traditional_authorities"("traditional_authority_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "villages_village_id_key" ON "villages"("village_id");

-- CreateIndex
CREATE UNIQUE INDEX "visits_visit_id_key" ON "visits"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "wards_location_id_key" ON "wards"("location_id");
