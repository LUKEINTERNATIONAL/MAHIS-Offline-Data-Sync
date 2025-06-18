import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly visitLogger = new Logger(VisitService.name);
  
  constructor(
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>
  ) {}

  // Create or update if exists
  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    try {
      const existingVisit = await this.visitModel.findOne({ id: createVisitDto.id });
      if (existingVisit) {
        this.visitLogger.warn(`Visit with id ${createVisitDto.id} already exists, updating instead`);
        return await this.updateByVisitId(createVisitDto.id, createVisitDto);
      }

      const createdVisit = new this.visitModel(createVisitDto);
      return await createdVisit.save();
    } catch (error) {
      this.visitLogger.error(`Failed to create visit: ${error.message}`, error.stack);
      return null;
    }
  }

  // Read all
  async findAll(): Promise<Visit[]> {
    try {
      return await this.visitModel.find().exec();
    } catch (error) {
      this.visitLogger.error(`Failed to fetch visits: ${error.message}`, error.stack);
      return [];
    }
  }

  // Read by custom id
  async findByVisitId(visitId: number): Promise<Visit> {
    try {
      const visit = await this.visitModel.findOne({ id: visitId });
      if (!visit) {
        this.visitLogger.warn(`Visit with ID ${visitId} not found`);
        return null;
      }
      return visit;
    } catch (error) {
      this.visitLogger.error(`Failed to find visit by ID ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update
  async updateByVisitId(visitId: number, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    try {
      const updatedVisit = await this.visitModel.findOneAndUpdate(
        { id: visitId },
        updateVisitDto,
        { new: true, runValidators: true }
      );

      if (!updatedVisit) {
        this.visitLogger.warn(`Visit with ID ${visitId} not found for update`);
        return null;
      }

      return updatedVisit;
    } catch (error) {
      this.visitLogger.error(`Failed to update visit by ID ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete
  async deleteByVisitId(visitId: number): Promise<Visit> {
    try {
      const deletedVisit = await this.visitModel.findOneAndDelete({ id: visitId });
      if (!deletedVisit) {
        this.visitLogger.warn(`Visit with ID ${visitId} not found for deletion`);
        return null;
      }
      return deletedVisit;
    } catch (error) {
      this.visitLogger.error(`Failed to delete visit by ID ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Bulk create many visits
  async createMany(visits: CreateVisitDto[]): Promise<Visit[]> {
    try {
      // Check for duplicate visit IDs
      const visitIds = visits.map(v => v.id);
      const duplicates = visitIds.filter((id, index) => visitIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        this.visitLogger.warn(`Duplicate visit IDs found: ${duplicates.join(', ')}, skipping duplicates`);
        // Filter out duplicates
        const uniqueVisits = visits.filter((visit, index, self) => 
          index === self.findIndex(v => v.id === visit.id)
        );
        visits = uniqueVisits;
      }

      // Check if any visit IDs already exist in database
      const existingVisits = await this.visitModel.find({ id: { $in: visitIds } });
      if (existingVisits.length > 0) {
        const existingIds = existingVisits.map(v => v.id);
        this.visitLogger.warn(`Visits with IDs already exist: ${existingIds.join(', ')}, updating existing ones`);
        
        // Separate new and existing visits
        const newVisits = visits.filter(visit => !existingIds.includes(visit.id));
        const existingVisitUpdates = visits.filter(visit => existingIds.includes(visit.id));
        
        // Update existing visits
        const updatePromises = existingVisitUpdates.map(visit => 
          this.updateByVisitId(visit.id, visit)
        );
        
        // Create new visits and update existing ones
        const [createdVisits, updatedVisits] = await Promise.all([
          newVisits.length > 0 ? this.visitModel.insertMany(newVisits) : Promise.resolve([]),
          Promise.all(updatePromises)
        ]);
        
        return [...(createdVisits as Visit[]), ...updatedVisits.filter(v => v !== null)];
      }

      const createdVisits = await this.visitModel.insertMany(visits);
      return createdVisits as Visit[];
    } catch (error) {
      this.visitLogger.error(`Failed to create multiple visits: ${error.message}`, error.stack);
      return [];
    }
  }
}