import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Relationship, RelationshipDocument } from './schema/relationship.schema';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';


@Injectable()
export class RelationshipService {
  constructor(
    @InjectModel(Relationship.name)
    private relationshipModel: Model<RelationshipDocument>,
    private configService: ConfigService,
    private httpService: HttpService
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
  async loadRelationships(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');
  
      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;
  
      // Fetch relationship data
      const relationshipsResponse$ = this.httpService.get(
        `${apiUrl}/types/relationships?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const relationshipsResponse = await lastValueFrom(relationshipsResponse$);
      const relationships = relationshipsResponse.data;
  
      // Bulk upsert all relationships (no filtering)
      const bulkOps = relationships.map(({ relationship_type_id, ...rest }) => ({
        updateOne: {
          filter: { relationship_type_id },
          update: { $set: { relationship_type_id, ...rest } },
          upsert: true,
        },
      }));
  
      if (bulkOps.length > 0) {
        await this.relationshipModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} relationships loaded.`);
      } else {
        console.log('No relationships found to load.');
      }
    } catch (error) {
      console.error('Failed to load relationships:', error?.response?.data || error);
      throw new Error('Could not load relationships');
    }
  }
  
}
