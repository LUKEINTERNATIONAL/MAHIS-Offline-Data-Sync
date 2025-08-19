import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Visit, Prisma } from '@prisma/client';
import { ServerTimeService } from '../SharedModule/shared.module';

export interface CreateVisitDto {
  visit_id: number;
  data?: any;
}

export interface UpdateVisitDto {
  visit_id?: number;
  data?: any;
}

export interface VisitQueryOptions {
  limit?: number;
  skip?: number;
  sort?: any;
}

@Injectable()
export class VisitService {
  private readonly logger = new Logger(VisitService.name);
  private readonly isMongoDB: boolean;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly serverTimeService: ServerTimeService,
  ) {
    this.isMongoDB = process.env.DATABASE_PROVIDER === 'mongodb';
  }

async getTodaysVisits(programId: string, date: string): Promise<Visit[]> {
    try {
      this.logger.log(`Fetching visits for programId: ${programId} on date: ${date}`);

      if (!programId || !date) {
        throw new BadRequestException('Program ID and date are required.');
      }
      
      let visits: Visit[] = [];

      if (this.isMongoDB) {
        // MongoDB Raw Query
        const [startDate, endDate] = this.getDateRange(date);
        
        const matchStage = {
          $match: {
            "data.programId": programId,
            "data.startDate": {
              $gte: startDate.toISOString(),
              $lt: endDate.toISOString(),
            }
          }
        };

        const result = await (this.prisma as any).$runCommandRaw({
          aggregate: 'Visit',
          pipeline: [
            matchStage,
            { $limit: 1000 } // Add a limit to prevent fetching too many records
          ],
          cursor: {}
        });

        visits = result?.cursor?.firstBatch?.map(this.deserializeData) || [];

      } else {
        // SQLite Raw Query
        const startDate = `${date}T00:00:00.000Z`;
        const endDate = `${date}T23:59:59.999Z`;

        const query = `
          SELECT * FROM visits
          WHERE 
            json_extract(data, '$.programId') = ? 
            AND json_extract(data, '$.startDate') BETWEEN ? AND ?
          ORDER BY "createdAt" DESC
        `;
        
        visits = await (this.prisma as any).$queryRawUnsafe(
          query,
          programId,
          startDate,
          endDate
        );
      }
      
      return visits.map(visit => ({
        ...this.deserializeData(visit.data)
      }));

    } catch (error) {
      this.logger.error(`Failed to fetch visits: ${error.message}`, error.stack);
      return [];
    }
  }

async getActiveVisits(programId: string, identifier: string): Promise<Visit[]> {
  try {
    this.logger.log(`Fetching visits for programId: ${programId} and patientId: ${identifier}`);

    if (!programId || !identifier) {
      throw new BadRequestException('Program ID and Patient ID are required.');
    }
    
    let visits: Visit[] = [];

    if (this.isMongoDB) {
      // MongoDB Raw Query
      const matchStage = {
        $match: {
          "data.programId": programId,
          "data.identifier": identifier,
        }
      };

      const result = await (this.prisma as any).$runCommandRaw({
        aggregate: 'Visit',
        pipeline: [
          matchStage,
          { $limit: 1000 }
        ],
        cursor: {}
      });

      visits = result?.cursor?.firstBatch?.map(visit => ({
        ...visit,
        data: this.deserializeData(visit.data)
      })) || [];

    } else {
      // SQLite Raw Query
      const query = `
        SELECT * FROM visits
        WHERE 
          json_extract(data, '$.programId') = ? 
          AND json_extract(data, '$.identifier') = ?
        ORDER BY "createdAt" DESC
      `;
      
      visits = await (this.prisma as any).$queryRawUnsafe(
        query,
        programId,
        identifier
      );

      // Deserialize data for each visit
      visits = visits.map(visit => ({
        ...visit,
        data: this.deserializeData(visit.data)
      }));
    }
    
    return visits;

  } catch (error) {
    this.logger.error(`Failed to fetch visits for patient: ${identifier}: ${error.message}`, error.stack);
    return [];
  }
}

  // Create or update if exists
  async create(createVisitDto: CreateVisitDto): Promise<Visit> {
    try {
      const existingVisit = await this.prisma.visit.findUnique({ 
        where: { visit_id: createVisitDto.visit_id } 
      });
      
      if (existingVisit) {
        this.logger.warn(`Visit with visit_id ${createVisitDto.visit_id} already exists, updating instead`);
        return await this.updateByVisitId(createVisitDto.visit_id, createVisitDto);
      }

      const visitData = {
        visit_id: createVisitDto.visit_id,
        data: this.serializeData(createVisitDto.data)
      };

      const createdVisit = await this.prisma.visit.create({
        data: visitData
      });
      
      return {
        ...createdVisit,
        data: this.deserializeData(createdVisit.data)
      };
    } catch (error) {
      this.logger.error(`Failed to create visit: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find all visits with optional query options
  async findAll(options?: VisitQueryOptions): Promise<Visit[]> {
    try {
      const queryOptions: Prisma.VisitFindManyArgs = {};

      if (options?.skip) {
        queryOptions.skip = options.skip;
      }

      if (options?.limit) {
        queryOptions.take = options.limit;
      }

      if (options?.sort) {
        // Convert Mongoose sort format to Prisma orderBy
        queryOptions.orderBy = this.convertSortToPrisma(options.sort);
      }

      const visits = await this.prisma.visit.findMany(queryOptions);
      
      // Deserialize data for each visit
      return visits.map(visit => ({
        ...visit,
        data: this.deserializeData(visit.data)
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch visits: ${error.message}`, error.stack);
      return [];
    }
  }

  // Find visit by Prisma ID
  async findById(id: string): Promise<Visit> {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { id }
      });

      if (!visit) {
        this.logger.warn(`Visit with ID ${id} not found`);
        return null;
      }

      return {
        ...visit,
        data: this.deserializeData(visit.data)
      };
    } catch (error) {
      this.logger.error(`Failed to find visit by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find visit by visit_id
  async findByVisitId(visitId: number): Promise<Visit> {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { visit_id: visitId }
      });
      
      if (!visit) {
        this.logger.warn(`Visit with visit_id ${visitId} not found`);
        return null;
      }
      
      return {
        ...visit,
        data: this.deserializeData(visit.data)
      };
    } catch (error) {
      this.logger.error(`Failed to find visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update visit by Prisma ID
  async updateById(id: string, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    try {
      // If updating the visit_id, check for conflicts
      if (updateVisitDto.visit_id !== undefined) {
        const existingVisit = await this.prisma.visit.findFirst({
          where: {
            visit_id: updateVisitDto.visit_id,
            NOT: { id }
          }
        });

        if (existingVisit) {
          this.logger.warn(`Visit with visit_id ${updateVisitDto.visit_id} already exists, skipping update`);
          return {
            ...existingVisit,
            data: this.deserializeData(existingVisit.data)
          };
        }
      }

      const updateData: Prisma.VisitUpdateInput = {};
      if (updateVisitDto.visit_id !== undefined) {
        updateData.visit_id = updateVisitDto.visit_id;
      }
      if (updateVisitDto.data !== undefined) {
        updateData.data = this.serializeData(updateVisitDto.data);
      }

      const updatedVisit = await this.prisma.visit.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedVisit,
        data: this.deserializeData(updatedVisit.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Visit with ID ${id} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update visit by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update visit by visit_id
  async updateByVisitId(visitId: number, updateVisitDto: UpdateVisitDto): Promise<Visit> {
    try {
      // If updating the visit_id, check for conflicts
      if (updateVisitDto.visit_id !== undefined && updateVisitDto.visit_id !== visitId) {
        const existingVisit = await this.prisma.visit.findUnique({
          where: { visit_id: updateVisitDto.visit_id }
        });

        if (existingVisit) {
          this.logger.warn(`Visit with visit_id ${updateVisitDto.visit_id} already exists, skipping update`);
          return {
            ...existingVisit,
            data: this.deserializeData(existingVisit.data)
          };
        }
      }

      const updateData: Prisma.VisitUpdateInput = {};
      if (updateVisitDto.visit_id !== undefined) {
        updateData.visit_id = updateVisitDto.visit_id;
      }
      if (updateVisitDto.data !== undefined) {
        updateData.data = this.serializeData(updateVisitDto.data);
      }

      const updatedVisit = await this.prisma.visit.update({
        where: { visit_id: visitId },
        data: updateData
      });

      return {
        ...updatedVisit,
        data: this.deserializeData(updatedVisit.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Visit with visit_id ${visitId} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete visit by Prisma ID
  async deleteById(id: string): Promise<Visit> {
    try {
      const deletedVisit = await this.prisma.visit.delete({
        where: { id }
      });

      return {
        ...deletedVisit,
        data: this.deserializeData(deletedVisit.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Visit with ID ${id} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete visit by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete visit by visit_id
  async deleteByVisitId(visitId: number): Promise<Visit> {
    try {
      const deletedVisit = await this.prisma.visit.delete({
        where: { visit_id: visitId }
      });
      
      return {
        ...deletedVisit,
        data: this.deserializeData(deletedVisit.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Visit with visit_id ${visitId} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete visit by visit_id ${visitId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Count total visits
  async count(): Promise<number> {
    try {
      return await this.prisma.visit.count();
    } catch (error) {
      this.logger.error(`Failed to count visits: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Check if visit exists by visit_id
  async existsByVisitId(visitId: number): Promise<boolean> {
    try {
      const visit = await this.prisma.visit.findUnique({
        where: { visit_id: visitId },
        select: { id: true }
      });
      return !!visit;
    } catch (error) {
      this.logger.error(`Failed to check visit existence for visit_id ${visitId}: ${error.message}`, error.stack);
      return false;
    }
  }

  // Find visits with pagination
  async findWithPagination(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.prisma.visit.findMany({
          skip,
          take: limit
        }),
        this.prisma.visit.count()
      ]);

      return {
        data: data.map(visit => ({
          ...visit,
          data: this.deserializeData(visit.data)
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch paginated visits: ${error.message}`, error.stack);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  // Bulk create many visits
  async createMany(visits: CreateVisitDto[]): Promise<Visit[]> {
    try {
      // Check for duplicate visit_ids
      const visitIds = visits.map(v => v.visit_id);
      const duplicates = visitIds.filter((id, index) => visitIds.indexOf(id) !== index);
      
      if (duplicates.length > 0) {
        this.logger.warn(`Duplicate visit_ids found: ${duplicates.join(', ')}, skipping duplicates`);
        visits = visits.filter((visit, index, self) => 
          index === self.findIndex(v => v.visit_id === visit.visit_id)
        );
      }

      // Check if any visit_ids already exist in database
      const existingVisits = await this.prisma.visit.findMany({
        where: { visit_id: { in: visitIds } }
      });

      if (existingVisits.length > 0) {
        const existingIds = existingVisits.map(v => v.visit_id);
        this.logger.warn(`Visits with visit_ids already exist: ${existingIds.join(', ')}, updating existing ones`);
        
        const newVisits = visits.filter(visit => !existingIds.includes(visit.visit_id));
        const existingVisitUpdates = visits.filter(visit => existingIds.includes(visit.visit_id));
        
        // Update existing visits
        const updatePromises = existingVisitUpdates.map(visit => 
          this.updateByVisitId(visit.visit_id, visit)
        );
        
        // Create new visits and update existing ones
        const [createdVisits, updatedVisits] = await Promise.all([
          newVisits.length > 0 ? this.prisma.visit.createMany({
            data: newVisits.map(visit => ({
              visit_id: visit.visit_id,
              data: this.serializeData(visit.data)
            }))
          }) : Promise.resolve({ count: 0 }),
          Promise.all(updatePromises)
        ]);
        
        // Fetch the created visits to return them
        const newlyCreatedVisits = newVisits.length > 0 ? 
          await this.prisma.visit.findMany({
            where: { visit_id: { in: newVisits.map(v => v.visit_id) } }
          }) : [];

        const allVisits = [
          ...newlyCreatedVisits.map(visit => ({
            ...visit,
            data: this.deserializeData(visit.data)
          })),
          ...updatedVisits.filter(v => v !== null)
        ];

        return allVisits;
      }

      // Create all visits
      await this.prisma.visit.createMany({
        data: visits.map(visit => ({
          visit_id: visit.visit_id,
          data: this.serializeData(visit.data)
        }))
      });

      // Fetch and return the created visits
      const createdVisits = await this.prisma.visit.findMany({
        where: { visit_id: { in: visitIds } }
      });

      return createdVisits.map(visit => ({
        ...visit,
        data: this.deserializeData(visit.data)
      }));
    } catch (error) {
      this.logger.error(`Failed to create multiple visits: ${error.message}`, error.stack);
      return [];
    }
  }

  // Bulk delete visits
  async deleteMany(visitIds: number[]): Promise<{ deletedCount: number }> {
    try {
      const result = await this.prisma.visit.deleteMany({
        where: { visit_id: { in: visitIds } }
      });
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error(`Failed to delete multiple visits: ${error.message}`, error.stack);
      return { deletedCount: 0 };
    }
  }

  // Helper method to create date range
  private getDateRange(dateString: string): [Date, Date] {
    const startDate = new Date(dateString);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);
    return [startDate, endDate];
  }

  // Helper methods for data serialization/deserialization
  private serializeData(data: any): any {
    if (data === null || data === undefined) return null;
    
    // For MongoDB, Prisma handles JSON natively
    // For SQLite, we need to stringify JSON data
    if (process.env.DATABASE_PROVIDER?.toString() === 'sqlite') {
      return JSON.stringify(data);
    }
    
    return data; // MongoDB case
  }

  private deserializeData(data: any): any {
    if (data === null || data === undefined) return null;
    
    // For SQLite, parse the JSON string
    if (process.env.DATABASE_PROVIDER?.toString() === 'sqlite' && typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        this.logger.warn(`Failed to parse JSON data: ${error.message}`);
        return data; // Return as-is if parsing fails
      }
    }
    
    return data; // MongoDB case or already parsed
  }

  // Helper to convert Mongoose sort to Prisma orderBy
  private convertSortToPrisma(sort: any): Prisma.VisitOrderByWithRelationInput {
    if (typeof sort === 'string') {
      const field = sort.startsWith('-') ? sort.substring(1) : sort;
      const direction = sort.startsWith('-') ? 'desc' : 'asc';
      return { [field]: direction };
    }
    
    if (typeof sort === 'object') {
      const orderBy: Prisma.VisitOrderByWithRelationInput = {};
      for (const [field, direction] of Object.entries(sort)) {
        orderBy[field] = direction === -1 || direction === 'desc' ? 'desc' : 'asc';
      }
      return orderBy;
    }
    
    return { visit_id: 'asc' }; // Default sort
  }
}