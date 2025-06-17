import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  constructor(
    @InjectModel(Stage.name) private stageModel: Model<StageDocument>
  ) {}

  // Create a new stage
  async create(createStageDto: CreateStageDto): Promise<Stage> {
    try {
      // Check if stage with same id already exists
      const existingStage = await this.stageModel.findOne({ id: createStageDto.id });
      if (existingStage) {
        throw new BadRequestException(`Stage with id ${createStageDto.id} already exists`);
      }

      const createdStage = new this.stageModel(createStageDto);
      return await createdStage.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create stage');
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
      throw new BadRequestException('Failed to fetch stages');
    }
  }

  // Find stage by MongoDB ObjectId
  async findById(id: string): Promise<Stage> {
    try {
      const stage = await this.stageModel.findById(id);
      if (!stage) {
        throw new NotFoundException(`Stage with ID ${id} not found`);
      }
      return stage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid stage ID format');
    }
  }

  // Find stage by custom id field
  async findByStageId(stageId: number): Promise<Stage> {
    try {
      const stage = await this.stageModel.findOne({ id: stageId });
      if (!stage) {
        throw new NotFoundException(`Stage with stage ID ${stageId} not found`);
      }
      return stage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to find stage');
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
          throw new BadRequestException(`Stage with id ${updateStageDto.id} already exists`);
        }
      }

      const updatedStage = await this.stageModel.findByIdAndUpdate(
        id,
        updateStageDto,
        { new: true, runValidators: true }
      );

      if (!updatedStage) {
        throw new NotFoundException(`Stage with ID ${id} not found`);
      }

      return updatedStage;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update stage');
    }
  }

  // Update stage by custom id field
  async updateByStageId(stageId: number, updateStageDto: UpdateStageDto): Promise<Stage> {
    try {
      // If updating the stage id, check for conflicts
      if (updateStageDto.id !== undefined && updateStageDto.id !== stageId) {
        const existingStage = await this.stageModel.findOne({ id: updateStageDto.id });
        if (existingStage) {
          throw new BadRequestException(`Stage with id ${updateStageDto.id} already exists`);
        }
      }

      const updatedStage = await this.stageModel.findOneAndUpdate(
        { id: stageId },
        updateStageDto,
        { new: true, runValidators: true }
      );

      if (!updatedStage) {
        throw new NotFoundException(`Stage with stage ID ${stageId} not found`);
      }

      return updatedStage;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update stage');
    }
  }

  // Delete stage by MongoDB ObjectId
  async deleteById(id: string): Promise<Stage> {
    try {
      const deletedStage = await this.stageModel.findByIdAndDelete(id);
      if (!deletedStage) {
        throw new NotFoundException(`Stage with ID ${id} not found`);
      }
      return deletedStage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete stage');
    }
  }

  // Delete stage by custom id field
  async deleteByStageId(stageId: number): Promise<Stage> {
    try {
      const deletedStage = await this.stageModel.findOneAndDelete({ id: stageId });
      if (!deletedStage) {
        throw new NotFoundException(`Stage with stage ID ${stageId} not found`);
      }
      return deletedStage;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete stage');
    }
  }

  // Count total stages
  async count(): Promise<number> {
    try {
      return await this.stageModel.countDocuments();
    } catch (error) {
      throw new BadRequestException('Failed to count stages');
    }
  }

  // Check if stage exists by custom id
  async existsByStageId(stageId: number): Promise<boolean> {
    try {
      const stage = await this.stageModel.findOne({ id: stageId }).select('_id');
      return !!stage;
    } catch (error) {
      throw new BadRequestException('Failed to check stage existence');
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
      throw new BadRequestException('Failed to fetch paginated stages');
    }
  }

  // Bulk operations
  async createMany(stages: CreateStageDto[]): Promise<Stage[]> {
        try {
        // Check for duplicate stage IDs
        const stageIds = stages.map(s => s.id);
        const duplicates = stageIds.filter((id, index) => stageIds.indexOf(id) !== index);
        if (duplicates.length > 0) {
            throw new BadRequestException(`Duplicate stage IDs found: ${duplicates.join(', ')}`);
        }

        // Check if any stage IDs already exist in database
        const existingStages = await this.stageModel.find({ id: { $in: stageIds } });
        if (existingStages.length > 0) {
            const existingIds = existingStages.map(s => s.id);
            throw new BadRequestException(`Stages with IDs already exist: ${existingIds.join(', ')}`);
        }

        const createdStages = await this.stageModel.insertMany(stages);
        return createdStages as any;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create multiple stages');
    }
  }

  async deleteMany(stageIds: number[]): Promise<{ deletedCount: number }> {
    try {
      const result = await this.stageModel.deleteMany({ id: { $in: stageIds } });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw new BadRequestException('Failed to delete multiple stages');
    }
  }
}