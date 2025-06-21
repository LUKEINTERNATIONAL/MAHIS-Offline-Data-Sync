import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Patient, Prisma } from '@prisma/client';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);
  private readonly isMongoDB: boolean;
  private readonly isSQLite: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const dbType = this.configService.get<string>('DATABASE_TYPE', 'mongodb');
    this.isMongoDB = dbType === 'mongodb';
    this.isSQLite = dbType === 'sqlite';
    this.logger.log(`Using ${dbType} database`);
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    const createData: Prisma.PatientCreateInput = {
      ...data,
      patientID: data.patientID!,
      message: data.message || '',
      data: this.isSQLite ? JSON.stringify(data.data) : data.data,
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
      // Handle nested data updates for both MongoDB and SQLite
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
            const existingData = existingPatient.data as any;
            updateData.data = JSON.stringify({ ...existingData, ...data.data });
          } else {
            updateData.data = JSON.stringify(data.data);
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
          timestamp: data.timestamp,
          data: this.isSQLite ? JSON.stringify(data.data || {}) : (data.data || {}),
          ...updateData
        }
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

  async searchPatientData(
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

    let whereClause: Prisma.PatientWhereInput = {};

    if (this.isMongoDB) {
      // MongoDB-specific search using JSON field queries
      whereClause = this.buildMongoSearchQuery(searchCriteria);
    } else {
      // SQLite-specific search using JSON functions or text search
      whereClause = this.buildSQLiteSearchQuery(searchCriteria);
    }

    this.logger.log(`Search criteria: ${JSON.stringify(searchCriteria)}`);
    this.logger.log(`Pagination: page=${page}, per_page=${per_page}, skip=${skip}`);

    const total = await this.prisma.patient.count({ where: whereClause });
    
    const patients = await this.prisma.patient.findMany({
      where: whereClause,
      select: { data: true },
      skip,
      take: per_page
    });

    const total_pages = Math.ceil(total / per_page);

    return {
      data: patients.map(patient => this.parsePatientData(patient).data),
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
      let whereClause: Prisma.PatientWhereInput;

      if (this.isMongoDB) {
        // MongoDB can query JSON fields directly
        whereClause = {
          data: {
            path: ['ID'],
            equals: dataId
          }
        } as any;
      } else {
        // SQLite - use JSON_EXTRACT function
        whereClause = {
          data: {
            contains: `"ID":"${dataId}"`
          }
        };
      }

      const patients = await this.prisma.patient.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

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
      updateData.data = JSON.stringify(data.data);
    }
    
    return updateData;
  }

  private buildMongoSearchQuery(searchCriteria: any): Prisma.PatientWhereInput {
    const conditions: any[] = [];

    if (searchCriteria.given_name) {
      const givenNameInput = searchCriteria.given_name.toString().trim();
      const isEntirelyNumeric = /^\d+$/.test(givenNameInput);
      
      if (isEntirelyNumeric) {
        // Search by NcdID pattern
        conditions.push({
          data: {
            path: ['NcdID'],
            string_ends_with: `-${givenNameInput}`
          }
        });
      } else {
        // Search by given_name
        conditions.push({
          data: {
            path: ['personInformation', 'given_name'],
            string_starts_with: givenNameInput
          }
        });
      }
    }

    if (searchCriteria.family_name) {
      conditions.push({
        data: {
          path: ['personInformation', 'family_name'],
          string_starts_with: searchCriteria.family_name
        }
      });
    }

    if (searchCriteria.gender) {
      conditions.push({
        data: {
          path: ['personInformation', 'gender'],
          string_starts_with: searchCriteria.gender
        }
      });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  private buildSQLiteSearchQuery(searchCriteria: any): Prisma.PatientWhereInput {
    // For SQLite, we'll use simpler text search in the JSON string
    // In a production system, you might want to use SQLite's JSON functions
    const searchTerms: string[] = [];

    if (searchCriteria.given_name) {
      const givenNameInput = searchCriteria.given_name.toString().trim();
      const isEntirelyNumeric = /^\d+$/.test(givenNameInput);
      
      if (isEntirelyNumeric) {
        searchTerms.push(`-${givenNameInput}`);
      } else {
        searchTerms.push(givenNameInput);
      }
    }

    if (searchCriteria.family_name) {
      searchTerms.push(searchCriteria.family_name);
    }

    if (searchCriteria.gender) {
      searchTerms.push(searchCriteria.gender);
    }

    if (searchTerms.length === 0) {
      return {};
    }

    // Simple contains search across all terms
    return {
      AND: searchTerms.map(term => ({
        data: {
          contains: term
        }
      }))
    };
  }
}