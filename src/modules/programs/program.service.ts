import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Program, ProgramDocument } from './schema/program.schema';


@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(Program.name)
    private programModel: Model<ProgramDocument>,
  ) {}

  async create(data: Partial<Program>): Promise<Program> {
    return this.programModel.create(data);
  }

  async findAll(): Promise<Program[]> {
    return this.programModel.find().exec();
  }

  async findById(id: number): Promise<Program | null> {
    return this.programModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Program>): Promise<Program | null> {
    return this.programModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Program | null> {
    return this.programModel.findOneAndDelete({ id }).exec();
  }
}
