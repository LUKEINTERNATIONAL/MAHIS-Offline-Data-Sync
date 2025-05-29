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

  async findById(id: number): Promise<Patient | null> {
    return this.patientModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Patient>): Promise<Patient | null> {
    return this.patientModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Patient | null> {
    return this.patientModel.findOneAndDelete({ id }).exec();
  }
}
