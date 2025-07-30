import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Patient, Prisma } from '@prisma/client';
import * as _ from 'lodash';
import { PrismaService } from '../prisma/prisma.service'; // Assuming this path is correct

// --- Type Definitions (Include these in your types file or at the top of PatientService) ---
interface PatientDemographics {
  given_name: string;
  middle_name: string;
  family_name: string;
  gender: string;
  birthdate: string; // YYYY-MM-DD
  birthdate_estimated: boolean;
  home_region: string;
  home_district: string;
  home_traditional_authority: string;
  home_village: string;
  current_region: string;
  current_district: string;
  current_traditional_authority: string;
  current_village: string;
  country: string;
  landmark: string;
  cell_phone_number: string;
  occupation: string;
  marital_status: string;
  religion: string;
  education_level: string;
}

interface DuplicateMatchResult {
  isPossibleDuplicate: boolean;
  bestMatchScore: number;
  bestMatchPatient: Patient | null;
  potentialMatches: Array<{ patient: Patient; score: number }>;
}

/**
 * Recursively converts BigInt values within an object or array to strings.
 * This is necessary because JSON.stringify cannot serialize BigInts directly.
 * @param obj The object or array to process.
 * @returns A new object/array with BigInts converted to strings.
 */
function convertBigIntToString(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj; // Return primitives directly
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item)); // Recurse for array elements
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    // Ensure it's an own property to avoid iterating prototype chain
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'bigint') {
        newObj[key] = value.toString(); // Convert BigInt to string
      } else if (typeof value === 'object' && value !== null) {
        newObj[key] = convertBigIntToString(value); // Recurse for nested objects
      } else {
        newObj[key] = value; // Copy other values directly
      }
    }
  }
  return newObj;
}


// --- Start of PatientService Class (assuming you have the rest of the class definition) ---
@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);
  private readonly isMongoDB: boolean;
  private readonly isSQLite: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const dbType = this.configService.get<string>('DATABASE_PROVIDER', 'mongodb');
    this.isMongoDB = dbType === 'mongodb';
    this.isSQLite = dbType === 'sqlite';
    this.logger.log(`Using ${dbType} database`);
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    const createData: Prisma.PatientCreateInput = {
      patientID: data.patientID!,
      message: data.message || '',
      data: this.isSQLite
        ? (typeof data.data === 'string' ? data.data : JSON.stringify(data.data))
        : data.data,
    };

    const patient = await this.prisma.patient.create({ data: createData });
    return this.parsePatientData(patient);
  }

  async findAll(): Promise<Patient[]> {
    const patients = await this.prisma.patient.findMany();
    return patients.map(patient => this.parsePatientData(patient));
  }

  async findUnsyncedPatients(): Promise<Patient[]> {
    this.logger.log('Fetching patients with sync_status: "unsynced"');
    try {
      let patients: Patient[] = [];
      if (this.isMongoDB) {
        const result = await (this.prisma as any).$runCommandRaw({
          aggregate: 'patients', // Use actual collection name if different
          pipeline: [
            { $match: { "data.sync_status": "unsynced" } },
          ],
          cursor: {}
        });

        patients = (result?.cursor?.firstBatch as Patient[]) || [];
      } else if (this.isSQLite) {
        patients = await (this.prisma as any).$queryRaw<Patient[]>`
          SELECT * FROM patients WHERE json_extract(data, '$.sync_status') = 'unsynced'
        `;
      } else {
        // Fallback for other/unconfigured DB types
        patients = await this.prisma.patient.findMany();
        patients = patients.filter((patient: any) => {
          let data = patient.data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {
              return false;
            }
          }
          return data && data.sync_status === 'unsynced';
        });
      }
      return patients.map(patient => this.parsePatientData(patient));
    } catch (error) {
      this.logger.error('Error fetching unsynced patients:', error);
      throw error;
    }
  }

  async isPatientPossibleDuplicate(
    inputData: PatientDemographics,
  ): Promise<DuplicateMatchResult> {
    this.logger.log(`Checking for possible duplicates for: ${inputData.given_name} ${inputData.family_name}`);

    // --- Input Data Normalization (Ensures string inputs are never null/undefined for queries) ---
    // Create a mutable copy and normalize string fields
    const normalizedInputData: PatientDemographics = { ...inputData };
    for (const key of Object.keys(normalizedInputData) as Array<keyof PatientDemographics>) {
      if (typeof normalizedInputData[key] === 'string' && (normalizedInputData[key] === null || normalizedInputData[key] === undefined)) {
        (normalizedInputData[key] as string) = ''; // Convert null/undefined strings to empty strings
      }
    }

    // --- Scoring Weights (can be adjusted) ---
    const WEIGHTS = {
      given_name: 20,
      family_name: 20,
      gender: 15,
      birthdate: 25, // Strongest match
      cell_phone_number: 10,
      home_district: 5,
      home_traditional_authority: 5,
      home_village: 5,
      // Total possible score: 105
    };

    // --- Thresholds ---
    const DUPLICATE_THRESHOLD = 60; // A score above this is considered a definite possible duplicate
    const MIN_POTENTIAL_MATCH_SCORE = 30; // Minimum score to be included in the 'potentialMatches' list

    let patientsWithScores: { patient: Patient; score: number }[] = [];

    try {
      if (this.isMongoDB) {
        // MongoDB aggregation pipeline for scoring
        const pipeline = [
          // Optional: Initial $match to narrow down documents for performance.
          // This requires some input fields to be present and reliable.
          // If inputData.given_name or family_name might be empty, adjust this $match or remove it.
          {
            $match: {
                $or: [
                    { "data.personInformation.given_name": { $regex: `^${normalizedInputData.given_name}`, $options: 'i' } },
                    { "data.personInformation.family_name": { $regex: `^${normalizedInputData.family_name}`, $options: 'i' } }
                ],
                // Add more strong filters if always available (e.g., gender, or birthdate year)
                // "data.personInformation.gender": normalizedInputData.gender,
                // "data.personInformation.birthdate": normalizedInputData.birthdate,
            }
          },
          {
            $addFields: {
              match_score: {
                $add: [
                  // Given Name (case-insensitive, starts with)
                  { $cond: [{ $regexMatch: { input: "$data.personInformation.given_name", regex: `^${normalizedInputData.given_name}`, options: "i" } }, WEIGHTS.given_name, 0] },
                  // Family Name (case-insensitive, starts with)
                  { $cond: [{ $regexMatch: { input: "$data.personInformation.family_name", regex: `^${normalizedInputData.family_name}`, options: "i" } }, WEIGHTS.family_name, 0] },
                  // Gender (exact match - safe as $eq handles null/missing stored values)
                  { $cond: [{ $eq: [{ $ifNull: ["$data.personInformation.gender", ""] }, normalizedInputData.gender] }, WEIGHTS.gender, 0] },
                  // Birthdate (exact match - safe as $eq handles null/missing stored values)
                  { $cond: [{ $eq: [{ $ifNull: ["$data.personInformation.birthdate", ""] }, normalizedInputData.birthdate] }, WEIGHTS.birthdate, 0] },
                  // Cell Phone Number (normalize by trimming spaces/dashes for both stored and input)
                  { $cond: [
                      { $eq: [
                          { $trim: { input: { $ifNull: ["$data.personInformation.cell_phone_number", ""] }, chars: " -()" } }, // Safely handle null/missing stored field
                          normalizedInputData.cell_phone_number.replace(/[\s()-]/g, '') // Input is already normalized to string
                      ]},
                      WEIGHTS.cell_phone_number,
                      0
                    ]
                  },
                  // Home District (case-insensitive, exact match)
                  { $cond: [{ $eq: [{ $toLower: { $ifNull: ["$data.personInformation.home_district", ""] } }, normalizedInputData.home_district.toLowerCase()] }, WEIGHTS.home_district, 0] },
                  // Home Traditional Authority (case-insensitive, exact match)
                  { $cond: [{ $eq: [{ $toLower: { $ifNull: ["$data.personInformation.home_traditional_authority", ""] } }, normalizedInputData.home_traditional_authority.toLowerCase()] }, WEIGHTS.home_traditional_authority, 0] },
                  // Home Village (case-insensitive, exact match)
                  { $cond: [{ $eq: [{ $toLower: { $ifNull: ["$data.personInformation.home_village", ""] } }, normalizedInputData.home_village.toLowerCase()] }, WEIGHTS.home_village, 0] },
                ],
              },
            },
          },
          {
            $match: {
              match_score: { $gte: MIN_POTENTIAL_MATCH_SCORE },
            },
          },
          {
            $sort: { match_score: -1 },
          },
          // Optional: { $limit: 10 }
        ];

        const result = await (this.prisma as any).$runCommandRaw({
          aggregate: 'patients',
          pipeline: pipeline,
          cursor: {},
        });

        const rawMatches = (result?.cursor?.firstBatch as any[]) || [];
        patientsWithScores = rawMatches.map((doc: any) => ({
          patient: this.parsePatientData(doc),
          score: doc.match_score,
        }));

      } else if (this.isSQLite) {
        // Prepare normalized input phone number for SQLite query
        const normalizedInputPhoneForSql = normalizedInputData.cell_phone_number.replace(/[\s()-]/g, '');

        // Corrected SQLite raw query using a subquery to filter with WHERE on calculated score
        const sqlQuery = Prisma.sql`
          SELECT
              id,
              "patientID",
              message,
              timestamp,
              data,
              "createdAt",
              "updatedAt",
              match_score
          FROM (
              SELECT
                  id,
                  "patientID",
                  message,
                  timestamp,
                  data,
                  "createdAt",
                  "updatedAt",
                  -- Calculate score for each patient
                  (
                    -- Given Name (case-insensitive, starts with). json_extract returns NULL for missing path, LOWER(NULL) is NULL, LIKE NULL is NULL. Safe.
                    CASE WHEN LOWER(json_extract(data, '$.personInformation.given_name')) LIKE LOWER(${normalizedInputData.given_name} || '%') THEN ${WEIGHTS.given_name} ELSE 0 END +
                    -- Family Name (case-insensitive, starts with)
                    CASE WHEN LOWER(json_extract(data, '$.personInformation.family_name')) LIKE LOWER(${normalizedInputData.family_name} || '%') THEN ${WEIGHTS.family_name} ELSE 0 END +
                    -- Gender (exact match)
                    CASE WHEN json_extract(data, '$.personInformation.gender') = ${normalizedInputData.gender} THEN ${WEIGHTS.gender} ELSE 0 END +
                    -- Birthdate (exact match)
                    CASE WHEN json_extract(data, '$.personInformation.birthdate') = ${normalizedInputData.birthdate} THEN ${WEIGHTS.birthdate} ELSE 0 END +
                    -- Cell Phone Number (safe normalization and exact match)
                    CASE WHEN REPLACE(REPLACE(REPLACE(json_extract(data, '$.personInformation.cell_phone_number'), ' ', ''), '-', ''), '(', '') = ${normalizedInputPhoneForSql} THEN ${WEIGHTS.cell_phone_number} ELSE 0 END +
                    -- Home District (case-insensitive, exact match)
                    CASE WHEN LOWER(json_extract(data, '$.personInformation.home_district')) = LOWER(${normalizedInputData.home_district}) THEN ${WEIGHTS.home_district} ELSE 0 END +
                    -- Home Traditional Authority (case-insensitive, exact match)
                    CASE WHEN LOWER(json_extract(data, '$.personInformation.home_traditional_authority')) = LOWER(${normalizedInputData.home_traditional_authority}) THEN ${WEIGHTS.home_traditional_authority} ELSE 0 END +
                    -- Home Village (case-insensitive, exact match)
                    CASE WHEN LOWER(json_extract(data, '$.personInformation.home_village')) = LOWER(${normalizedInputData.home_village}) THEN ${WEIGHTS.home_village} ELSE 0 END
                  ) AS match_score
              FROM patients
          ) AS scored_patients
          WHERE match_score >= ${MIN_POTENTIAL_MATCH_SCORE}
          ORDER BY match_score DESC;
        `;

        const rawMatches: any[] = await (this.prisma as any).$queryRaw(sqlQuery);
        patientsWithScores = rawMatches.map((row: any) => ({
          patient: this.parsePatientData(row as Patient),
          score: row.match_score ? Number(row.match_score) : 0,
        }));

      } else {
        // Fallback: In-memory filter and scoring
        this.logger.warn('Unknown database provider, performing in-memory duplicate check. This can be inefficient for large datasets.');
        const allPatients = await this.prisma.patient.findMany();

        patientsWithScores = allPatients.map(patient => {
          let score = 0;
          const storedPatientData = this.parsePatientData(patient).data as any;

          if (!storedPatientData || !storedPatientData.personInformation) {
            return { patient, score: 0 };
          }

          const personInfo = storedPatientData.personInformation;

          const getSafeLower = (val: any) => (val ? String(val).toLowerCase() : '');
          const getSafeNormalizedPhone = (val: any) => (val ? String(val).replace(/[\s()-]/g, '') : '');

          if (getSafeLower(personInfo.given_name).startsWith(getSafeLower(normalizedInputData.given_name))) {
            score += WEIGHTS.given_name;
          }
          if (getSafeLower(personInfo.family_name).startsWith(getSafeLower(normalizedInputData.family_name))) {
            score += WEIGHTS.family_name;
          }
          if (getSafeLower(personInfo.gender) === getSafeLower(normalizedInputData.gender)) {
            score += WEIGHTS.gender;
          }
          if (personInfo.birthdate === normalizedInputData.birthdate) {
            score += WEIGHTS.birthdate;
          }
          if (getSafeNormalizedPhone(personInfo.cell_phone_number) === getSafeNormalizedPhone(normalizedInputData.cell_phone_number)) {
            score += WEIGHTS.cell_phone_number;
          }
          if (getSafeLower(personInfo.home_district) === getSafeLower(normalizedInputData.home_district)) {
            score += WEIGHTS.home_district;
          }
          if (getSafeLower(personInfo.home_traditional_authority) === getSafeLower(normalizedInputData.home_traditional_authority)) {
            score += WEIGHTS.home_traditional_authority;
          }
          if (getSafeLower(personInfo.home_village) === getSafeLower(normalizedInputData.home_village)) {
            score += WEIGHTS.home_village;
          }

          return { patient, score };
        })
          .filter(match => match.score >= MIN_POTENTIAL_MATCH_SCORE)
          .sort((a, b) => b.score - a.score);
      }

      const bestMatch = patientsWithScores.length > 0 ? patientsWithScores[0] : null;

      return {
        isPossibleDuplicate: bestMatch ? bestMatch.score >= DUPLICATE_THRESHOLD : false,
        bestMatchScore: bestMatch ? bestMatch.score : 0,
        bestMatchPatient: bestMatch ? bestMatch.patient : null,
        potentialMatches: patientsWithScores,
      };
    } catch (error) {
      this.logger.error(`Error checking for possible patient duplicates: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { id }
    });
    
    return patient ? this.parsePatientData(patient) : null;
  }

  async findByPatientId(patientID: string): Promise<Patient | null> {
    const patient = await this.prisma.patient.findUnique({
      where: { patientID }
    });
    
    return patient ? this.parsePatientData(patient) : null;
  }

  async updateById(id: string, data: Partial<Patient>): Promise<Patient | null> {
    try {
      const updateData = this.prepareUpdateData(data);
      const patient = await this.prisma.patient.update({
        where: { id },
        data: updateData
      });
      
      return this.parsePatientData(patient);
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        return null;
      }
      throw error;
    }
  }

  async updateByPatientId(
    patientID: string,
    data: Partial<Patient> & { data?: any }
  ): Promise<Patient | null> {
    try {
      let updateData: any = { ...data };
      
      if (data.data) {
        if (this.isMongoDB) {
          const existingPatient = await this.findByPatientId(patientID);
          if (existingPatient) {
            const existingData = existingPatient.data as any;
            updateData.data = { ...existingData, ...data.data };
          }
        } else {
          const existingPatient = await this.findByPatientId(patientID);
          if (existingPatient) {
            updateData.data = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
          } else {
            updateData.data = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
          }
        }
      }

      this.logger.log(`Updating/Creating patient ${patientID} with data`);
      
      const patient = await this.prisma.patient.upsert({
        where: { patientID },
        update: this.prepareUpdateData(updateData),
        create: {
          patientID,
          message: data.message || '',
          timestamp: data.timestamp
            ? typeof data.timestamp === 'string'
              ? data.timestamp
              : data.timestamp
            : undefined,
          data: this.isSQLite
            ? (typeof data.data === 'string' ? data.data : JSON.stringify(data.data || {}))
            : (data.data || {}),
        } as any
      });
      
      return this.parsePatientData(patient);
    } catch (error) {
      this.logger.error(`Error updating patient ${patientID}:`, error);
      throw error;
    }
  }

  async deleteById(id: string): Promise<Patient | null> {
    try {
      const patient = await this.prisma.patient.delete({
        where: { id }
      });
      
      return this.parsePatientData(patient);
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async deleteByPatientId(patientID: string): Promise<Patient | null> {
    try {
      const patient = await this.prisma.patient.delete({
        where: { patientID }
      });
      
      return this.parsePatientData(patient);
    } catch (error) {
      if (error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async findOne(filter: Prisma.PatientWhereInput): Promise<Patient | null> {
    const patient = await this.prisma.patient.findFirst({
      where: filter
    });
    
    return patient ? this.parsePatientData(patient) : null;
  }

  async getAllPatientIDs(): Promise<string[]> {
    const patients = await this.prisma.patient.findMany({
      select: { patientID: true }
    });
    
    return patients.map(p => p.patientID);
  }

async searchPatientDataWithRawQuery(
  searchCriteria: { 
    given_name?: string; 
    family_name?: string; 
    gender?: string;
  },
  pagination: {
    page?: number;
    per_page?: number;
  } = {}
): Promise<{
  data: any[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }
}> {
  const page = pagination.page || 1;
  const per_page = pagination.per_page || 10;
  const skip = (page - 1) * per_page;

  let patients: any[] = [];
  let total = 0;

  this.logger.log(`Search criteria: ${JSON.stringify(searchCriteria)}`);
  this.logger.log(`Pagination: page=${page}, per_page=${per_page}, skip=${skip}`);

  if (this.isMongoDB) {
    try {
      const matchStage: any = {};
      
      const safeGivenName = searchCriteria.given_name ? String(searchCriteria.given_name).trim() : '';
      const safeFamilyName = searchCriteria.family_name ? String(searchCriteria.family_name).trim() : '';
      const safeGender = searchCriteria.gender ? String(searchCriteria.gender).trim() : '';


      if (safeGivenName) {
        matchStage["data.personInformation.given_name"] = { 
          $regex: `^${safeGivenName}`, 
          $options: 'i' 
        };
      }

      if (safeFamilyName) {
        matchStage["data.personInformation.family_name"] = { 
          $regex: `^${safeFamilyName}`, 
          $options: 'i' 
        };
      }

      if (safeGender) {
        matchStage["data.personInformation.gender"] = { 
          $regex: `^${safeGender}`, 
          $options: 'i' 
        };
      }

      const countResult = await (this.prisma as any).$runCommandRaw({
        aggregate: 'patients',
        pipeline: [
          { $match: matchStage },
          { $count: "total" }
        ],
        cursor: {}
      });
      
      total = countResult?.cursor?.firstBatch?.[0]?.total || 0;

      const result = await (this.prisma as any).$runCommandRaw({
        aggregate: 'patients',
        pipeline: [
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: per_page }
        ],
        cursor: {}
      });

      patients = (result?.cursor?.firstBatch || []);
    } catch (error) {
      this.logger.error('MongoDB raw query failed, falling back to memory search:', error);
    }
  } else {
    // SQLite raw query approach
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      
      const safeGivenName = searchCriteria.given_name ? String(searchCriteria.given_name).trim() : '';
      const safeFamilyName = searchCriteria.family_name ? String(searchCriteria.family_name).trim() : '';
      const safeGender = searchCriteria.gender ? String(searchCriteria.gender).trim() : '';

      if (safeGivenName) {
        conditions.push(`LOWER(json_extract(data, '$.personInformation.given_name')) LIKE ?`);
        params.push(`${safeGivenName.toLowerCase()}%`);
      }


      if (safeFamilyName) {
        conditions.push(`LOWER(json_extract(data, '$.personInformation.family_name')) LIKE ?`);
        params.push(`${safeFamilyName.toLowerCase()}%`);
      }

      if (safeGender) {
        conditions.push(`LOWER(json_extract(data, '$.personInformation.gender')) LIKE ?`);
        params.push(`${safeGender.toLowerCase()}%`);
      }

      if (conditions.length > 0) {
       
        const whereClause = conditions.join(' AND ');
        
        const countQuery = `SELECT COUNT(*) as total FROM patients WHERE ${whereClause}`;
        const countResult = await (this.prisma as any).$queryRawUnsafe(countQuery, ...params);
        total = countResult[0]?.total ? Number(countResult[0].total) : 0;

        const dataQuery = `SELECT * FROM patients WHERE ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        patients = await (this.prisma as any).$queryRawUnsafe(dataQuery, ...params, per_page, skip);
      } else {
        total = await this.prisma.patient.count();
        patients = await this.prisma.patient.findMany({
          skip,
          take: per_page,
          orderBy: { createdAt: 'desc' }
        });
      }
    } catch (error) {
      this.logger.error('SQLite raw query failed, falling back to memory search:', error);
    }
  }

  const total_pages = Math.ceil(total / per_page);
  const parsedPatients = patients.map(patient => this.parsePatientData(patient));

  return {
    data: parsedPatients.map(patient => patient.data),
    pagination: {
      current_page: page,
      per_page: per_page,
      total: total,
      total_pages: total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }
  };
}

  async findDuplicatesByDataId(dataId: string): Promise<{
    patients: Patient[];
    latestPatient: Patient | null;
    duplicateCount: number;
  }> {
    try {
      let patients: Patient[] = [];

      if (this.isMongoDB) {
        const result = await (this.prisma as any).$runCommandRaw({
          aggregate: 'patients',
          pipeline: [
            { $match: { "data.ID": dataId } },
            { $sort: { createdAt: -1 } }
          ],
          cursor: {}
        });

        patients = (result?.cursor?.firstBatch as Patient[]) || [];
      } else {
        // Cast result of $queryRaw to the expected Patient[] type to resolve ts(2347)
        patients = await (this.prisma as any).$queryRaw<Patient[]>`
          SELECT * FROM patients
          WHERE json_extract(data, '$.id') = ${dataId}
          ORDER BY createdAt DESC
        `;
      }

      const parsedPatients = patients.map(p => this.parsePatientData(p));

      return {
        patients: parsedPatients,
        latestPatient: parsedPatients.length > 0 ? parsedPatients[0] : null,
        duplicateCount: Math.max(0, parsedPatients.length - 1)
      };
    } catch (error) {
      this.logger.error(`Error in findDuplicatesByDataId: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAndDeduplicateByDataId(dataId: string): Promise<{
    keptPatient: Patient | null;
    removedCount: number;
    removedPatients: Patient[];
  }> {
    try {
      this.logger.log(`Searching for patients with data.ID: ${dataId}`);
      
      const duplicateResult = await this.findDuplicatesByDataId(dataId);
      
      if (duplicateResult.patients.length === 0) {
        this.logger.log(`No patients found with data.ID: ${dataId}`);
        return {
          keptPatient: null,
          removedCount: 0,
          removedPatients: []
        };
      }

      if (duplicateResult.patients.length === 1) {
        this.logger.log(`Only one patient found with data.ID: ${dataId}, no duplicates to remove`);
        return {
          keptPatient: duplicateResult.patients[0],
          removedCount: 0,
          removedPatients: []
        };
      }

      const keptPatient = duplicateResult.latestPatient!;
      const duplicatesToRemove = duplicateResult.patients.slice(1);

      this.logger.log(`Found ${duplicateResult.patients.length} patients with data.ID: ${dataId}`);
      this.logger.log(`Keeping patient with id: ${keptPatient.id} (created: ${keptPatient.createdAt})`);
      this.logger.log(`Removing ${duplicatesToRemove.length} duplicate(s)`);

      const idsToRemove = duplicatesToRemove.map(p => p.id);
      const deleteResult = await this.prisma.patient.deleteMany({
        where: {
          id: { in: idsToRemove }
        }
      });

      this.logger.log(`Successfully removed ${deleteResult.count} duplicate patients`);

      return {
        keptPatient: keptPatient,
        removedCount: deleteResult.count,
        removedPatients: duplicatesToRemove
      };
    } catch (error) {
      this.logger.error(`Error in findAndDeduplicateByDataId: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(patientID: string, data: Partial<Patient>): Promise<Patient | null> {
    return this.updateByPatientId(patientID, data);
  }

  async delete(patientID: string): Promise<Patient | null> {
    return this.deleteByPatientId(patientID);
  }

  private parsePatientData(patient: Patient): Patient {
    let parsedPatient = patient;

    // Handle JSON parsing for SQLite 'data' field
    if (this.isSQLite && typeof patient.data === 'string') {
      try {
        parsedPatient = {
          ...patient,
          data: JSON.parse(patient.data)
        };
      } catch (error) {
        this.logger.error(`Error parsing JSON data for patient ${patient.id}:`, error);
        // Fallback to original if parsing fails, but BigInt conversion will still attempt
      }
    }

    // Crucial: Recursively convert any BigInt values to strings to prevent JSON serialization errors
    return convertBigIntToString(parsedPatient);
  }

  private prepareUpdateData(data: Partial<Patient>): Prisma.PatientUpdateInput {
    const updateData: Prisma.PatientUpdateInput = { ...data };
    
    if (this.isSQLite && data.data) {
      updateData.data = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
    }
    
    return updateData;
  }
}