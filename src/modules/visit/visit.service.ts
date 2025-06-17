import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visit, VisitDocument } from './schema/visit.schema';

export interface CreateVisitDto {
  id: number;
  data?: any;
}

export interface UpdateVisitDto {
  id?: number;
  data?: any;
}

@Injectable()
export class VisitService {
  constructor(
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>
  ) {}

  // Create
  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    try {
      const existingVisit = await this.visitModel.findOne({ id: createVisitDto.id });
      if (existingVisit) {
        throw new BadRequestException(`Visit with id ${createVisitDto.id} already exists`);
      }

      const createdVisit = new this.visitModel(createVisitDto);
      return await createdVisit.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create visit');
    }
  }

  // Read all
  async findAll(): Promise<Visit[]> {
    return await this.visitModel.find().exec();
  }

  // Read by custom id
  async findByVisitId(visitId: number): Promise<Visit> {
    const visit = await this.visitModel.findOne({ id: visitId });
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }
    return visit;
  }

  // Update
  async updateByVisitId(visitId: number, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    const updatedVisit = await this.visitModel.findOneAndUpdate(
      { id: visitId },
      updateVisitDto,
      { new: true, runValidators: true }
    );

    if (!updatedVisit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }

    return updatedVisit;
  }

  // Delete
  async deleteByVisitId(visitId: number): Promise<Visit> {
    const deletedVisit = await this.visitModel.findOneAndDelete({ id: visitId });
    if (!deletedVisit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }
    return deletedVisit;
  }
}