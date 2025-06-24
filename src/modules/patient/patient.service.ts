import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Patient, Prisma } from '@prisma/client';
import * as _ from 'lodash';

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
          // For MongoDB, we can use nested updates
          const existingPatient = await this.findByPatientId(patientID);
          if (existingPatient) {
            const existingData = existingPatient.data as any;
            updateData.data = { ...existingData, ...data.data };
          }
        } else {
          // For SQLite, merge with existing JSON data
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
      if (error.code === 'P2025') { // Record not found
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
      if (error.code === 'P2025') { // Record not found
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
    // MongoDB raw query approach
    try {
      const matchStage: any = {};
      
      if (searchCriteria.given_name) {
        const givenNameInput = searchCriteria.given_name.toString().trim();
        const isEntirelyNumeric = /^\d+$/.test(givenNameInput);
        
        if (isEntirelyNumeric) {
          matchStage["data.NcdID"] = { $regex: `-${givenNameInput}`, $options: 'i' };
        } else {
          matchStage["data.personInformation.given_name"] = { 
            $regex: `^${givenNameInput}`, 
            $options: 'i' 
          };
        }
      }

      if (searchCriteria.family_name) {
        matchStage["data.personInformation.family_name"] = { 
          $regex: `^${searchCriteria.family_name}`, 
          $options: 'i' 
        };
      }

      if (searchCriteria.gender) {
        matchStage["data.personInformation.gender"] = { 
          $regex: `^${searchCriteria.gender}`, 
          $options: 'i' 
        };
      }

      // Get total count
      const countResult = await (this.prisma as any).$runCommandRaw({
        aggregate: 'patients',
        pipeline: [
          { $match: matchStage },
          { $count: "total" }
        ],
        cursor: {}
      });
      
      total = countResult?.cursor?.firstBatch?.[0]?.total || 0;

      // Get paginated results  
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
      
      if (searchCriteria.given_name) {
        const givenNameInput = searchCriteria.given_name.toString().trim().toLowerCase();
        const isEntirelyNumeric = /^\d+$/.test(givenNameInput);

        if (isEntirelyNumeric) {
          conditions.push(`LOWER(json_extract(data, '$.NcdID')) LIKE ?`);
          params.push(`%-${givenNameInput}%`);
        } else {
          conditions.push(`LOWER(json_extract(data, '$.personInformation.given_name')) LIKE ?`);
          params.push(`${givenNameInput}%`);
        }
      }


      if (searchCriteria.family_name) {
        conditions.push(`LOWER(json_extract(data, '$.personInformation.family_name')) LIKE ?`);
        params.push(`${searchCriteria.family_name.toLowerCase()}%`);
      }

      if (searchCriteria.gender) {
        conditions.push(`LOWER(json_extract(data, '$.personInformation.gender')) LIKE ?`);
        params.push(`${searchCriteria.gender.toLowerCase()}%`);
      }

      if (conditions.length > 0) {
       
        const whereClause = conditions.join(' AND ');
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM patients WHERE ${whereClause}`;
        const countResult = await (this.prisma as any).$queryRawUnsafe(countQuery, ...params);
        total = countResult[0]?.total ? Number(countResult[0].total) : 0;

        // Get paginated results
        const dataQuery = `SELECT * FROM patients WHERE ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
        patients = await (this.prisma as any).$queryRawUnsafe(dataQuery, ...params, per_page, skip);
      } else {
        // No search criteria
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
        // For MongoDB, the patient "data" object uses "ID" as the key
        const result = await (this.prisma as any).$runCommandRaw({
          aggregate: 'Patient',
          pipeline: [
        { $match: { "data.ID": dataId } },
        { $sort: { createdAt: -1 } }
          ],
          cursor: {}
        });

        patients = (result?.cursor?.firstBatch as Patient[]) || [];
      } else {
        // For SQLite, the patient "data" object uses "id" as the key
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

      // Remove the duplicates
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

  // Legacy methods for backward compatibility
  async update(patientID: string, data: Partial<Patient>): Promise<Patient | null> {
    return this.updateByPatientId(patientID, data);
  }

  async delete(patientID: string): Promise<Patient | null> {
    return this.deleteByPatientId(patientID);
  }

  // Helper methods
  private parsePatientData(patient: Patient): Patient {
    if (this.isSQLite && typeof patient.data === 'string') {
      try {
        return {
          ...patient,
          data: JSON.parse(patient.data)
        };
      } catch (error) {
        this.logger.error(`Error parsing JSON data for patient ${patient.id}:`, error);
        return patient;
      }
    }
    return patient;
  }

  private prepareUpdateData(data: Partial<Patient>): Prisma.PatientUpdateInput {
    const updateData: Prisma.PatientUpdateInput = { ...data };
    
    if (this.isSQLite && data.data) {
      updateData.data = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
    }
    
    return updateData;
  }
}