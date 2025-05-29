import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diagnosis, DiagnosisDocument } from './schema/diagnosis.schema';


@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(Diagnosis.name)
    private diagnosisModel: Model<DiagnosisDocument>,
  ) {}

  async create(data: Partial<Diagnosis>): Promise<Diagnosis> {
    return this.diagnosisModel.create(data);
  }

  async findAll(): Promise<Diagnosis[]> {
    return this.diagnosisModel.find().exec();
  }

  async findById(id: number): Promise<Diagnosis | null> {
    return this.diagnosisModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Diagnosis>): Promise<Diagnosis | null> {
    return this.diagnosisModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Diagnosis | null> {
    return this.diagnosisModel.findOneAndDelete({ id }).exec();
  }
}
