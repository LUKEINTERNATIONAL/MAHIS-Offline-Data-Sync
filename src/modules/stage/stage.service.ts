import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateStageDto {
  stage_id: number; // Changed from 'id' to match Prisma schema
  data?: any;
}

export interface UpdateStageDto {
  stage_id?: number;
  data?: any;
}

export interface StageQueryOptions {
  limit?: number;
  skip?: number;
  sort?: any;
}

@Injectable()
export class StageService {
  private readonly logger = new Logger(StageService.name);

  constructor(private prisma: PrismaService) {}

  // Create a new stage or update if exists
  async create(createStageDto: CreateStageDto) {
    try {
      // Check if stage with same stage_id already exists
      const existingStage = await this.prisma.stage.findUnique({
        where: { stage_id: createStageDto.stage_id }
      });

      if (existingStage) {
        this.logger.warn(`Stage with stage_id ${createStageDto.stage_id} already exists, updating instead`);
        return await this.updateByStageId(createStageDto.stage_id, createStageDto);
      }

      // Handle data serialization based on database type
      const stageData = {
        stage_id: createStageDto.stage_id,
        data: this.serializeData(createStageDto.data)
      };

      return await this.prisma.stage.create({
        data: stageData
      });
    } catch (error) {
      this.logger.error(`Failed to create stage: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find all stages with optional query options
  async findAll(options?: StageQueryOptions) {
    try {
      const queryOptions: Prisma.StageFindManyArgs = {};

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

      const stages = await this.prisma.stage.findMany(queryOptions);
      
      // Deserialize data for each stage
      return stages.map(stage => ({
        ...stage,
        data: this.deserializeData(stage.data)
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch stages: ${error.message}`, error.stack);
      return [];
    }
  }

  // Find stage by Prisma ID
  async findById(id: string) {
    try {
      const stage = await this.prisma.stage.findUnique({
        where: { id }
      });

      if (!stage) {
        this.logger.warn(`Stage with ID ${id} not found`);
        return null;
      }

      return {
        ...stage,
        data: this.deserializeData(stage.data)
      };
    } catch (error) {
      this.logger.error(`Failed to find stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find stage by stage_id
  async findByStageId(stageId: number) {
    try {
      const stage = await this.prisma.stage.findUnique({
        where: { stage_id: stageId }
      });

      if (!stage) {
        this.logger.warn(`Stage with stage_id ${stageId} not found`);
        return null;
      }

      return {
        ...stage,
        data: this.deserializeData(stage.data)
      };
    } catch (error) {
      this.logger.error(`Failed to find stage by stage_id ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update stage by Prisma ID
  async updateById(id: string, updateStageDto: UpdateStageDto) {
    try {
      // If updating the stage_id, check for conflicts
      if (updateStageDto.stage_id !== undefined) {
        const existingStage = await this.prisma.stage.findFirst({
          where: {
            stage_id: updateStageDto.stage_id,
            NOT: { id }
          }
        });

        if (existingStage) {
          this.logger.warn(`Stage with stage_id ${updateStageDto.stage_id} already exists, skipping update`);
          return {
            ...existingStage,
            data: this.deserializeData(existingStage.data)
          };
        }
      }

      const updateData: Prisma.StageUpdateInput = {};
      if (updateStageDto.stage_id !== undefined) {
        updateData.stage_id = updateStageDto.stage_id;
      }
      if (updateStageDto.data !== undefined) {
        updateData.data = this.serializeData(updateStageDto.data);
      }

      const updatedStage = await this.prisma.stage.update({
        where: { id },
        data: updateData
      });

      return {
        ...updatedStage,
        data: this.deserializeData(updatedStage.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Stage with ID ${id} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update stage by stage_id
  async updateByStageId(stageId: number, updateStageDto: UpdateStageDto) {
    try {
      // If updating the stage_id, check for conflicts
      if (updateStageDto.stage_id !== undefined && updateStageDto.stage_id !== stageId) {
        const existingStage = await this.prisma.stage.findUnique({
          where: { stage_id: updateStageDto.stage_id }
        });

        if (existingStage) {
          this.logger.warn(`Stage with stage_id ${updateStageDto.stage_id} already exists, skipping update`);
          return {
            ...existingStage,
            data: this.deserializeData(existingStage.data)
          };
        }
      }

      const updateData: Prisma.StageUpdateInput = {};
      if (updateStageDto.stage_id !== undefined) {
        updateData.stage_id = updateStageDto.stage_id;
      }
      if (updateStageDto.data !== undefined) {
        updateData.data = this.serializeData(updateStageDto.data);
      }

      const updatedStage = await this.prisma.stage.update({
        where: { stage_id: stageId },
        data: updateData
      });

      return {
        ...updatedStage,
        data: this.deserializeData(updatedStage.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Stage with stage_id ${stageId} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update stage by stage_id ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete stage by Prisma ID
  async deleteById(id: string) {
    try {
      const deletedStage = await this.prisma.stage.delete({
        where: { id }
      });

      return {
        ...deletedStage,
        data: this.deserializeData(deletedStage.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Stage with ID ${id} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete stage by stage_id
  async deleteByStageId(stageId: number) {
    try {
      const deletedStage = await this.prisma.stage.delete({
        where: { stage_id: stageId }
      });

      return {
        ...deletedStage,
        data: this.deserializeData(deletedStage.data)
      };
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        this.logger.warn(`Stage with stage_id ${stageId} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete stage by stage_id ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Count total stages
  async count(): Promise<number> {
    try {
      return await this.prisma.stage.count();
    } catch (error) {
      this.logger.error(`Failed to count stages: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Check if stage exists by stage_id
  async existsByStageId(stageId: number): Promise<boolean> {
    try {
      const stage = await this.prisma.stage.findUnique({
        where: { stage_id: stageId },
        select: { id: true }
      });
      return !!stage;
    } catch (error) {
      this.logger.error(`Failed to check stage existence for stage_id ${stageId}: ${error.message}`, error.stack);
      return false;
    }
  }

  // Find stages with pagination
  async findWithPagination(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        this.prisma.stage.findMany({
          skip,
          take: limit
        }),
        this.prisma.stage.count()
      ]);

      return {
        data: data.map(stage => ({
          ...stage,
          data: this.deserializeData(stage.data)
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch paginated stages: ${error.message}`, error.stack);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  // Bulk operations
  async createMany(stages: CreateStageDto[]) {
    try {
      // Check for duplicate stage_ids
      const stageIds = stages.map(s => s.stage_id);
      const duplicates = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
      
      if (duplicates.length > 0) {
        this.logger.warn(`Duplicate stage_ids found: ${duplicates.join(', ')}, skipping duplicates`);
        stages = stages.filter((stage, index, self) => 
          index === self.findIndex(s => s.stage_id === stage.stage_id)
        );
      }

      // Check if any stage_ids already exist in database
      const existingStages = await this.prisma.stage.findMany({
        where: { stage_id: { in: stageIds } }
      });

      if (existingStages.length > 0) {
        const existingIds = existingStages.map(s => s.stage_id);
        this.logger.warn(`Stages with stage_ids already exist: ${existingIds.join(', ')}, updating existing ones`);
        
        const newStages = stages.filter(stage => !existingIds.includes(stage.stage_id));
        const existingStageUpdates = stages.filter(stage => existingIds.includes(stage.stage_id));
        
        // Update existing stages
        const updatePromises = existingStageUpdates.map(stage => 
          this.updateByStageId(stage.stage_id, stage)
        );
        
        // Create new stages and update existing ones
        const [createdStages, updatedStages] = await Promise.all([
          newStages.length > 0 ? this.prisma.stage.createMany({
            data: newStages.map(stage => ({
              stage_id: stage.stage_id,
              data: this.serializeData(stage.data)
            }))
          }) : Promise.resolve({ count: 0 }),
          Promise.all(updatePromises)
        ]);
        
        // Fetch the created stages to return them
        const newlyCreatedStages = newStages.length > 0 ? 
          await this.prisma.stage.findMany({
            where: { stage_id: { in: newStages.map(s => s.stage_id) } }
          }) : [];

        const allStages = [
          ...newlyCreatedStages.map(stage => ({
            ...stage,
            data: this.deserializeData(stage.data)
          })),
          ...updatedStages.filter(s => s !== null)
        ];

        return allStages;
      }

      // Create all stages
      await this.prisma.stage.createMany({
        data: stages.map(stage => ({
          stage_id: stage.stage_id,
          data: this.serializeData(stage.data)
        }))
      });

      // Fetch and return the created stages
      const createdStages = await this.prisma.stage.findMany({
        where: { stage_id: { in: stageIds } }
      });

      return createdStages.map(stage => ({
        ...stage,
        data: this.deserializeData(stage.data)
      }));
    } catch (error) {
      this.logger.error(`Failed to create multiple stages: ${error.message}`, error.stack);
      return [];
    }
  }

  async deleteMany(stageIds: number[]): Promise<{ deletedCount: number }> {
    try {
      const result = await this.prisma.stage.deleteMany({
        where: { stage_id: { in: stageIds } }
      });
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error(`Failed to delete multiple stages: ${error.message}`, error.stack);
      return { deletedCount: 0 };
    }
  }

  // Helper methods for data serialization/deserialization
  private serializeData(data: any): any {
    if (data === null || data === undefined) return null;
    
    // For MongoDB, Prisma handles JSON natively
    // For SQLite, we need to stringify JSON data
    if (process.env.DATABASE_PROVIDER.toString() === 'sqlite') {
      return JSON.stringify(data);
    }
    
    return data; // MongoDB case
  }

  private deserializeData(data: any): any {
    if (data === null || data === undefined) return null;
    
    // For SQLite, parse the JSON string
    if (process.env.DATABASE_PROVIDER.toString() === 'sqlite' && typeof data === 'string') {
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
  private convertSortToPrisma(sort: any): Prisma.StageOrderByWithRelationInput {
    if (typeof sort === 'string') {
      const field = sort.startsWith('-') ? sort.substring(1) : sort;
      const direction = sort.startsWith('-') ? 'desc' : 'asc';
      return { [field]: direction };
    }
    
    if (typeof sort === 'object') {
      const orderBy: Prisma.StageOrderByWithRelationInput = {};
      for (const [field, direction] of Object.entries(sort)) {
        orderBy[field] = direction === -1 || direction === 'desc' ? 'desc' : 'asc';
      }
      return orderBy;
    }
    
    return { stage_id: 'asc' }; // Default sort
  }
}