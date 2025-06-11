import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Relationship, RelationshipDocument } from './schema/relationship.schema';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship.name)
    private readonly relationshipModel: Model<RelationshipDocument>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Relationship>): Promise<Relationship> {
    return this.relationshipModel.create(data);
  }

  async findAll(): Promise<Relationship[]> {
    return this.relationshipModel.find().exec();
  }

  // Assuming 'relationship_type_id' is your unique identifier, not just 'id'
  async findById(id: number): Promise<Relationship | null> {
    return this.relationshipModel.findOne({ relationship_type_id: id }).exec();
  }

  async update(id: number, data: Partial<Relationship>): Promise<Relationship | null> {
    return this.relationshipModel.findOneAndUpdate({ relationship_type_id: id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Relationship | null> {
    return this.relationshipModel.findOneAndDelete({ relationship_type_id: id }).exec();
  }

  async count(): Promise<number> {
    return this.relationshipModel.countDocuments().exec();
  }

  async loadRelationships(expectedCount?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

      // Fetch relationships without pagination
      const relationshipsResponse$ = this.httpService.get(`${apiUrl}/types/relationships?paginate=false`, {
        headers: { Authorization: token },
      });
      const relationshipsResponse = await lastValueFrom(relationshipsResponse$);
      const relationships = relationshipsResponse.data;

      // Check if already up-to-date
      const totalInDb = await this.count();
      if (expectedCount && totalInDb === expectedCount) {
        console.log('Relationships already up to date.');
        return;
      }

      // Clear existing relationships first
      await this.relationshipModel.deleteMany({});

      // Insert all relationships at once
      if (relationships.length > 0) {
        await this.relationshipModel.insertMany(relationships);
        console.log(`${relationships.length} relationships loaded.`);
      } else {
        console.log('No relationships found to load.');
      }
    } catch (error) {
      console.error('Failed to load relationships:', error?.response?.data || error);
      // throw new Error('Could not load relationships');
    }
  }
}
