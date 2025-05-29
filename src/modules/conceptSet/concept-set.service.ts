import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConceptSet, ConceptSetDocument } from './schema/concept-set.schema';


@Injectable()
export class ConceptSetService {
  constructor(
    @InjectModel(ConceptSet.name)
    private conceptSetModel: Model<ConceptSetDocument>,
  ) {}

  async create(data: Partial<ConceptSet>): Promise<ConceptSet> {
    return this.conceptSetModel.create(data);
  }

  async findAll(): Promise<ConceptSet[]> {
    return this.conceptSetModel.find().exec();
  }

  async findById(id: number): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<ConceptSet>): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOneAndDelete({ id }).exec();
  }
}
