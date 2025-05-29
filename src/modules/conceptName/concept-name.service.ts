import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConceptName, ConceptNameDocument } from './schemas/concept-name.schema';


@Injectable()
export class ConceptNameService {
  constructor(
    @InjectModel(ConceptName.name) private conceptNameModel: Model<ConceptNameDocument>,
  ) {}

  async create(conceptName: Partial<ConceptName>): Promise<ConceptName> {
    return this.conceptNameModel.create(conceptName);
  }

  async findAll(): Promise<ConceptName[]> {
    return this.conceptNameModel.find().exec();
  }

  async findById(id: number): Promise<ConceptName | null> {
    return this.conceptNameModel.findOne({ conceptName_id: id }).exec();
  }

}
