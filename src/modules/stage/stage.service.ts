import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Stage, StageDocument } from './schema/stage.schema';

export interface CreateStageDto {
  id: number;
  data?: any;
}

export interface UpdateStageDto {
  id?: number;
  data?: any;
}

export interface StageQueryOptions {
  limit?: number;
  skip?: number;
  sort?: any;
}

@Injectable()
export class StageService {
  private readonly Stagelogger = new Logger(StageService.name);
  constructor(
    @InjectModel(Stage.name) private stageModel: Model<StageDocument>
  ) {}

  // Create a new stage or update if exists
  async create(createStageDto: CreateStageDto): Promise<Stage> {
    try {
      // Check if stage with same id already exists
      const existingStage = await this.stageModel.findOne({ id: createStageDto.id });
      if (existingStage) {
        this.Stagelogger.warn(`Stage with id ${createStageDto.id} already exists, updating instead`);
        return await this.updateByStageId(createStageDto.id, createStageDto);
      }

      const createdStage = new this.stageModel(createStageDto);
      return await createdStage.save();
    } catch (error) {
      this.Stagelogger.error(`Failed to create stage: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find all stages with optional query options
  async findAll(options?: StageQueryOptions): Promise<Stage[]> {
    try {
      let query = this.stageModel.find();

      if (options?.sort) {
        query = query.sort(options.sort);
      }

      if (options?.skip) {
        query = query.skip(options.skip);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return await query.exec();
    } catch (error) {
      this.Stagelogger.error(`Failed to fetch stages: ${error.message}`, error.stack);
      return [];
    }
  }

  // Find stage by MongoDB ObjectId
  async findById(id: string): Promise<Stage> {
    try {
      const stage = await this.stageModel.findById(id);
      if (!stage) {
        this.Stagelogger.warn(`Stage with ID ${id} not found`);
        return null;
      }
      return stage;
    } catch (error) {
      this.Stagelogger.error(`Failed to find stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Find stage by custom id field
  async findByStageId(stageId: number): Promise<Stage> {
    try {
      const stage = await this.stageModel.findOne({ id: stageId });
      if (!stage) {
        this.Stagelogger.warn(`Stage with stage ID ${stageId} not found`);
        return null;
      }
      return stage;
    } catch (error) {
      this.Stagelogger.error(`Failed to find stage by stage ID ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update stage by MongoDB ObjectId
  async updateById(id: string, updateStageDto: UpdateStageDto): Promise<Stage> {
    try {
      // If updating the stage id, check for conflicts
      if (updateStageDto.id !== undefined) {
        const existingStage = await this.stageModel.findOne({ 
          id: updateStageDto.id,
          _id: { $ne: id }
        });
        if (existingStage) {
          this.Stagelogger.warn(`Stage with id ${updateStageDto.id} already exists, skipping update`);
          return existingStage;
        }
      }

      const updatedStage = await this.stageModel.findByIdAndUpdate(
        id,
        updateStageDto,
        { new: true, runValidators: true }
      );

      if (!updatedStage) {
        this.Stagelogger.warn(`Stage with ID ${id} not found for update`);
        return null;
      }

      return updatedStage;
    } catch (error) {
      this.Stagelogger.error(`Failed to update stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Update stage by custom id field
  async updateByStageId(stageId: number, updateStageDto: UpdateStageDto): Promise<Stage> {
    try {
      // If updating the stage id, check for conflicts
      if (updateStageDto.id !== undefined && updateStageDto.id !== stageId) {
        const existingStage = await this.stageModel.findOne({ id: updateStageDto.id });
        if (existingStage) {
          this.Stagelogger.warn(`Stage with id ${updateStageDto.id} already exists, skipping update`);
          return existingStage;
        }
      }

      const updatedStage = await this.stageModel.findOneAndUpdate(
        { id: stageId },
        updateStageDto,
        { new: true, runValidators: true }
      );

      if (!updatedStage) {
        this.Stagelogger.warn(`Stage with stage ID ${stageId} not found for update`);
        return null;
      }

      return updatedStage;
    } catch (error) {
      this.Stagelogger.error(`Failed to update stage by stage ID ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete stage by MongoDB ObjectId
  async deleteById(id: string): Promise<Stage> {
    try {
      const deletedStage = await this.stageModel.findByIdAndDelete(id);
      if (!deletedStage) {
        this.Stagelogger.warn(`Stage with ID ${id} not found for deletion`);
        return null;
      }
      return deletedStage;
    } catch (error) {
      this.Stagelogger.error(`Failed to delete stage by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Delete stage by custom id field
  async deleteByStageId(stageId: number): Promise<Stage> {
    try {
      const deletedStage = await this.stageModel.findOneAndDelete({ id: stageId });
      if (!deletedStage) {
        this.Stagelogger.warn(`Stage with stage ID ${stageId} not found for deletion`);
        return null;
      }
      return deletedStage;
    } catch (error) {
      this.Stagelogger.error(`Failed to delete stage by stage ID ${stageId}: ${error.message}`, error.stack);
      return null;
    }
  }

  // Count total stages
  async count(): Promise<number> {
    try {
      return await this.stageModel.countDocuments();
    } catch (error) {
      this.Stagelogger.error(`Failed to count stages: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Check if stage exists by custom id
  async existsByStageId(stageId: number): Promise<boolean> {
    try {
      const stage = await this.stageModel.findOne({ id: stageId }).select('_id');
      return !!stage;
    } catch (error) {
      this.Stagelogger.error(`Failed to check stage existence for ID ${stageId}: ${error.message}`, error.stack);
      return false;
    }
  }

  // Find stages with pagination
  async findWithPagination(page: number = 1, limit: number = 10): Promise<{
    data: Stage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.stageModel.find().skip(skip).limit(limit).exec(),
        this.stageModel.countDocuments()
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.Stagelogger.error(`Failed to fetch paginated stages: ${error.message}`, error.stack);
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
  async createMany(stages: CreateStageDto[]): Promise<Stage[]> {
    try {
      // Check for duplicate stage IDs
      const stageIds = stages.map(s => s.id);
      const duplicates = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        this.Stagelogger.warn(`Duplicate stage IDs found: ${duplicates.join(', ')}, skipping duplicates`);
        // Filter out duplicates
        const uniqueStages = stages.filter((stage, index, self) => 
          index === self.findIndex(s => s.id === stage.id)
        );
        stages = uniqueStages;
      }

      // Check if any stage IDs already exist in database
      const existingStages = await this.stageModel.find({ id: { $in: stageIds } });
      if (existingStages.length > 0) {
        const existingIds = existingStages.map(s => s.id);
        this.Stagelogger.warn(`Stages with IDs already exist: ${existingIds.join(', ')}, updating existing ones`);
        
        // Separate new and existing stages
        const newStages = stages.filter(stage => !existingIds.includes(stage.id));
        const existingStageUpdates = stages.filter(stage => existingIds.includes(stage.id));
        
        // Update existing stages
        const updatePromises = existingStageUpdates.map(stage => 
          this.updateByStageId(stage.id, stage)
        );
        
        // Create new stages and update existing ones
        const [createdStages, updatedStages] = await Promise.all([
          newStages.length > 0 ? this.stageModel.insertMany(newStages) : Promise.resolve([]),
          Promise.all(updatePromises)
        ]);
        
        return [...(createdStages as Stage[]), ...updatedStages.filter(s => s !== null)];
      }

      const createdStages = await this.stageModel.insertMany(stages);
      return createdStages as Stage[];
    } catch (error) {
      this.Stagelogger.error(`Failed to create multiple stages: ${error.message}`, error.stack);
      return [];
    }
  }

  async deleteMany(stageIds: number[]): Promise<{ deletedCount: number }> {
    try {
      const result = await this.stageModel.deleteMany({ id: { $in: stageIds } });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.Stagelogger.error(`Failed to delete multiple stages: ${error.message}`, error.stack);
      return { deletedCount: 0 };
    }
  }
}