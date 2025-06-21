import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Visit } from '@prisma/client';

export interface CreateVisitDto {
  visit_id: number;
  data?: any;
}

export interface UpdateVisitDto {
  visit_id?: number;
  data?: any;
}

@Injectable()
export class VisitService {
  private readonly visitLogger = new Logger(VisitService.name);
  
  constructor(
    private readonly prisma: PrismaService
  ) {}

  // Helper method to handle data serialization based on database type
  private processData(data: any): any {
    // For SQLite, we need to stringify JSON data
    // For MongoDB, we can store JSON directly
    // Prisma will handle this automatically based on the schema field type
    return data;
  }

  // Create or update if exists
  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    try {
      const existingVisit = await this.prisma.visit.findUnique({ 
        where: { visit_id: createVisitDto.visit_id } 
      });
      
      if (existingVisit) {
        this.visitLogger.warn(`Visit with visit_id ${createVisitDto.visit_id} already exists, updating instead`);
        return await this.updateByVisitId(createVisitDto.visit_id, createVisitDto);
      }

      const createdVisit = await this.prisma.visit.create({
        data: {
          visit_id: createVisitDto.visit_id,
          data: this.processData(createVisitDto.data)
        }
      });
      
      return createdVisit;
    } catch (error) {
      this.visitLogger.error(`Failed to create visit: ${error.message}`, error.stack);
      return null;
    }
  }

  // Read all
  async findAll(): Promise<Visit[]> {
    try {
      return await this.prisma.visit.findMany();
    } catch (error) {
      this.visitLogger.error(`Failed to fetch visits: ${error.message}`, error.stack);
      return [];
    }
  }

  // Read by visit_id
  async findByVisitId(visitId: number): Promise<Visit> {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { visit_id: visitId }
      });
      
      if (!visit) {
        this.visitLogger.warn(`Visit with visit_id ${visitId} not found`);
        return null;
      }
      
      return visit;
    } catch (error) {
      this.visitLogger.error(`Failed to find visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update
  async updateByVisitId(visitId: number, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    try {
      const updateData: any = {};
      
      if (updateVisitDto.visit_id !== undefined) {
        updateData.visit_id = updateVisitDto.visit_id;
      }
      
      if (updateVisitDto.data !== undefined) {
        updateData.data = this.processData(updateVisitDto.data);
      }

      const updatedVisit = await this.prisma.visit.update({
        where: { visit_id: visitId },
        data: updateData
      });

      return updatedVisit;
    } catch (error) {
      // If record not found, return null (Prisma error P2025)
      if (error.code === 'P2025') {
        this.visitLogger.warn(`Visit with visit_id ${visitId} not found for update`);
        return null;
      }
      
      this.visitLogger.error(`Failed to update visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete
  async deleteByVisitId(visitId: number): Promise<Visit> {
    try {
      const deletedVisit = await this.prisma.visit.delete({
        where: { visit_id: visitId }
      });
      
      return deletedVisit;
    } catch (error) {
      // If record not found, return null (Prisma error P2025)
      if (error.code === 'P2025') {
        this.visitLogger.warn(`Visit with visit_id ${visitId} not found for deletion`);
        return null;
      }
      
      this.visitLogger.error(`Failed to delete visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Bulk create many visits
  async createMany(visits: CreateVisitDto[]): Promise<Visit[]> {
    try {
      // Check for duplicate visit IDs
      const visitIds = visits.map(v => v.visit_id);
      const duplicates = visitIds.filter((id, index) => visitIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        this.visitLogger.warn(`Duplicate visit_ids found: ${duplicates.join(', ')}, skipping duplicates`);
        // Filter out duplicates
        const uniqueVisits = visits.filter((visit, index, self) => 
          index === self.findIndex(v => v.visit_id === visit.visit_id)
        );
        visits = uniqueVisits;
      }

      // Check if any visit IDs already exist in database
      const existingVisits = await this.prisma.visit.findMany({
        where: { visit_id: { in: visitIds } }
      });
      
      if (existingVisits.length > 0) {
        const existingIds = existingVisits.map(v => v.visit_id);
        this.visitLogger.warn(`Visits with visit_ids already exist: ${existingIds.join(', ')}, updating existing ones`);
        
        // Separate new and existing visits
        const newVisits = visits.filter(visit => !existingIds.includes(visit.visit_id));
        const existingVisitUpdates = visits.filter(visit => existingIds.includes(visit.visit_id));
        
        // Create new visits
        let createdVisits: Visit[] = [];
        if (newVisits.length > 0) {
          // Process data for each visit
          const processedNewVisits = newVisits.map(visit => ({
            visit_id: visit.visit_id,
            data: this.processData(visit.data)
          }));

          const createManyResult = await this.prisma.visit.createMany({
            data: processedNewVisits,
            skipDuplicates: true
          });
          
          // Fetch the created visits (since createMany doesn't return the created records)
          createdVisits = await this.prisma.visit.findMany({
            where: { visit_id: { in: newVisits.map(v => v.visit_id) } }
          });
        }
        
        // Update existing visits
        const updatePromises = existingVisitUpdates.map(visit => 
          this.updateByVisitId(visit.visit_id, visit)
        );
        const updatedVisits = await Promise.all(updatePromises);
        
        return [...createdVisits, ...updatedVisits.filter(v => v !== null)];
      }

      // Create all visits if none exist
      // Process data for each visit
      const processedVisits = visits.map(visit => ({
        visit_id: visit.visit_id,
        data: this.processData(visit.data)
      }));

      const createManyResult = await this.prisma.visit.createMany({
        data: processedVisits,
        skipDuplicates: true
      });
      
      // Fetch the created visits
      const createdVisits = await this.prisma.visit.findMany({
        where: { visit_id: { in: visitIds } }
      });
      
      return createdVisits;
    } catch (error) {
      this.visitLogger.error(`Failed to create multiple visits: ${error.message}`, error.stack);
      return [];
    }
  }
}