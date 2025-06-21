import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export interface CreateUserDto {
  user_id: number;
  locationId: string;
}

export interface UpdateUserDto {
  user_id?: number;
  locationId?: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User | null> {
    try {
      // Check if user with same user_id already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { user_id: createUserDto.user_id }
      });

      if (existingUser) {
        this.logger.warn(`User with user_id ${createUserDto.user_id} already exists, updating instead`);
        return await this.updateByUserId(createUserDto.user_id, createUserDto);
      }

      return await this.prisma.user.create({
        data: createUserDto
      });
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      return null;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      return [];
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${id}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByUserId(userId: number): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { user_id: userId }
      });
    } catch (error) {
      this.logger.error(`Failed to find user by user_id ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async findByLocationId(locationId: string): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        where: { locationId }
      });
    } catch (error) {
      this.logger.error(`Failed to find users by locationId ${locationId}: ${error.message}`, error.stack);
      return [];
    }
  }

  async updateByUserId(userId: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      // If updating the user_id, check for conflicts
      if (updateUserDto.user_id !== undefined && updateUserDto.user_id !== userId) {
        const existingUser = await this.prisma.user.findUnique({
          where: { user_id: updateUserDto.user_id }
        });

        if (existingUser) {
          this.logger.warn(`User with user_id ${updateUserDto.user_id} already exists, skipping update`);
          return existingUser;
        }
      }

      return await this.prisma.user.update({
        where: { user_id: userId },
        data: updateUserDto
      });
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`User with user_id ${userId} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update user by user_id ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async deleteByUserId(userId: number): Promise<User | null> {
    try {
      return await this.prisma.user.delete({
        where: { user_id: userId }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`User with user_id ${userId} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete user by user_id ${userId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async existsByUserId(userId: number): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { id: true }
      });
      return !!user;
    } catch (error) {
      this.logger.error(`Failed to check user existence for user_id ${userId}: ${error.message}`, error.stack);
      return false;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto
      });
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`User with ID ${id} not found for update`);
        return null;
      }
      this.logger.error(`Failed to update user by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async delete(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(`User with ID ${id} not found for deletion`);
        return null;
      }
      this.logger.error(`Failed to delete user by ID ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.user.count();
    } catch (error) {
      this.logger.error(`Failed to count users: ${error.message}`, error.stack);
      return 0;
    }
  }
}