import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schema/patient.schema';


@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);
  constructor(
    @InjectModel(Patient.name)
    private patientModel: Model<PatientDocument>,
  ) {}

  async create(data: Partial<Patient>): Promise<Patient> {
    return this.patientModel.create(data);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientModel.find().exec();
  }

  // Find by MongoDB's _id (ObjectId)
  async findById(id: string): Promise<Patient | null> {
    return this.patientModel.findById(id).exec();
  }

  // Find by your custom patientID field
  async findByPatientId(patientID: string): Promise<Patient | null> {
    return this.patientModel.findOne({ patientID }).exec();
  }

  // Update by MongoDB's _id
  async updateById(id: string, data: Partial<Patient>): Promise<Patient | null> {
    return this.patientModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  // Update by patientID

// Updated version that can also update nested data fields
async updateByPatientId(
  patientID: string,
  data: Partial<Patient> & {
    data?: any; // Allow updating nested data object
  }
): Promise<Patient | null> {
  const updateQuery: any = {};
  
  // Handle top-level field updates
  Object.keys(data).forEach(key => {
    if (key === 'data' && data.data) {
      // Handle nested data object updates
      Object.keys(data.data).forEach(nestedKey => {
        updateQuery[`data.${nestedKey}`] = data.data[nestedKey];
      });
    } else {
      // Handle regular top-level field updates
      updateQuery[key] = data[key];
    }
  });

  this.logger.log(`Updating/Creating patient ${patientID} with query:`, updateQuery);
  
  return this.patientModel.findOneAndUpdate(
    { patientID },
    updateQuery,
    { 
      new: true,      // Return the updated document
      upsert: true,   // Create if document doesn't exist
      runValidators: true  // Run schema validators on update
    }
  ).exec();
}

  // Delete by MongoDB's _id
  async deleteById(id: string): Promise<Patient | null> {
    return this.patientModel.findByIdAndDelete(id).exec();
  }

  // Delete by patientID
  async deleteByPatientId(patientID: string): Promise<Patient | null> {
    return this.patientModel.findOneAndDelete({ patientID }).exec();
  }

  // Upsert functionality
  async upsert(filter: any, update: any) {
    return this.patientModel.updateOne(filter, update, { upsert: true }).exec();
  }

  // Find one with custom filter
  async findOne(filter: any): Promise<Patient | null> {
    return this.patientModel.findOne(filter).exec();
  }

  // Legacy methods for backward compatibility (if needed)
  async update(patientID: string, data: Partial<Patient>): Promise<Patient | null> {
    return this.updateByPatientId(patientID, data);
  }

  async delete(patientID: string): Promise<Patient | null> {
    return this.deleteByPatientId(patientID);
  }

  async getAllPatientIDs(): Promise<string[]> {
    const patients = await this.patientModel.find({}, { patientID: 1, _id: 0 }).exec();
    return patients.map((p) => p.patientID);
  }

  async searchPatientData(
    searchCriteria: { 
      given_name?: string; 
      family_name?: string; 
      gender?: string 
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
    const query: any = {};
    
    if (searchCriteria.given_name) {
      query['data.personInformation.given_name'] = {
        $regex: `^${searchCriteria.given_name}`,
        $options: 'i'
      };
    }
    
    if (searchCriteria.family_name) {
      query['data.personInformation.family_name'] = {
        $regex: `^${searchCriteria.family_name}`,
        $options: 'i'
      };
    }
    
    if (searchCriteria.gender) {
      query['data.personInformation.gender'] = {
        $regex: `^${searchCriteria.gender}`,
        $options: 'i'
      };
    }
    
    // Pagination setup
    const page = pagination.page || 1;
    const per_page = pagination.per_page || 10;
    const skip = (page - 1) * per_page;

    this.logger.log(`Search criteria: ${JSON.stringify(searchCriteria)}`);
    this.logger.log(`Pagination: page=${page}, per_page=${per_page}, skip=${skip}`);
    
    // Get total count for pagination info
    const total = await this.patientModel.countDocuments(query).exec();
    
    // Get paginated results
    const patients = await this.patientModel
      .find(query, { data: 1, _id: 0 })
      .skip(skip)
      .limit(per_page)
      .exec();
    
    const total_pages = Math.ceil(total / per_page);
    
    return {
      data: patients.map(patient => patient.data),
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

  // Find patients by data.ID, keep the latest, remove duplicates
  async findAndDeduplicateByDataId(dataId: string): Promise<{
    keptPatient: Patient | null;
    removedCount: number;
    removedPatients: Patient[];
  }> {
    try {
      this.logger.log(`Searching for patients with data.ID: ${dataId}`);
      
      // Find all patients with the matching data.ID
      const patients = await this.patientModel
        .find({ 'data.ID': dataId })
        .sort({ createdAt: -1 }) // Sort by createdAt descending (newest first)
        .exec();

      if (patients.length === 0) {
        this.logger.log(`No patients found with data.ID: ${dataId}`);
        return {
          keptPatient: null,
          removedCount: 0,
          removedPatients: []
        };
      }

      if (patients.length === 1) {
        this.logger.log(`Only one patient found with data.ID: ${dataId}, no duplicates to remove`);
        return {
          keptPatient: patients[0],
          removedCount: 0,
          removedPatients: []
        };
      }

      // Keep the first one (most recent due to sorting)
      const keptPatient = patients[0];
      const duplicatesToRemove = patients.slice(1);

      this.logger.log(`Found ${patients.length} patients with data.ID: ${dataId}`);
      this.logger.log(`Keeping patient with _id: ${keptPatient._id} (created: ${keptPatient.createdAt})`);
      this.logger.log(`Removing ${duplicatesToRemove.length} duplicate(s)`);

      // Remove the duplicates
      const idsToRemove = duplicatesToRemove.map(p => p._id);
      const deleteResult = await this.patientModel.deleteMany({
        _id: { $in: idsToRemove }
      }).exec();

      this.logger.log(`Successfully removed ${deleteResult.deletedCount} duplicate patients`);

      return {
        keptPatient: keptPatient,
        removedCount: deleteResult.deletedCount,
        removedPatients: duplicatesToRemove
      };

    } catch (error) {
      this.logger.error(`Error in findAndDeduplicateByDataId: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Alternative version that only finds without removing (for safety/preview)
  async findDuplicatesByDataId(dataId: string): Promise<{
    patients: Patient[];
    latestPatient: Patient | null;
    duplicateCount: number;
  }> {
    try {
      const patients = await this.patientModel
        .find({ 'data.ID': dataId })
        .sort({ createdAt: -1 })
        .exec();

      return {
        patients: patients,
        latestPatient: patients.length > 0 ? patients[0] : null,
        duplicateCount: Math.max(0, patients.length - 1)
      };

    } catch (error) {
      this.logger.error(`Error in findDuplicatesByDataId: ${error.message}`, error.stack);
      throw error;
    }
  }
}