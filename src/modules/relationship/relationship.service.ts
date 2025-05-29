import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Relationship, RelationshipDocument } from './schema/relationship.schema';


@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<RelationshipDocument>,
  ) {}

  async create(data: Partial<Relationship>): Promise<Relationship> {
    return this.relationshipModel.create(data);
  }

  async findAll(): Promise<Relationship[]> {
    return this.relationshipModel.find().exec();
  }

  async findById(id: number): Promise<Relationship | null> {
    return this.relationshipModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Relationship>): Promise<Relationship | null> {
    return this.relationshipModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Relationship | null> {
    return this.relationshipModel.findOneAndDelete({ id }).exec();
  }
}
