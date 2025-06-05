import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schema/patient.schema';

@Injectable()
export class PatientService {
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
  async updateByPatientId(patientID: string, data: Partial<Patient>): Promise<Patient | null> {
    return this.patientModel.findOneAndUpdate({ patientID }, data, { new: true }).exec();
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
}