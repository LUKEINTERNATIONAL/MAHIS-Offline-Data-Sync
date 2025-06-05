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
}