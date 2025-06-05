import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Program, ProgramDocument } from './schema/program.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(Program.name)
    private programModel: Model<ProgramDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async create(data: Partial<Program>): Promise<Program> {
    return this.programModel.create(data);
  }

  async findAll(): Promise<Program[]> {
    return this.programModel.find().exec();
  }

  async findById(id: number): Promise<Program | null> {
    return this.programModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Program>): Promise<Program | null> {
    return this.programModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Program | null> {
    return this.programModel.findOneAndDelete({ id }).exec();
  }

  async count(): Promise<number> {
    return this.programModel.countDocuments().exec();
  }

  async loadPrograms(count?: number): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch programs
      const programsResponse$ = this.httpService.get(
        `${apiUrl}/programs?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      const programsResponse = await lastValueFrom(programsResponse$);
      const programs = programsResponse.data.programs || programsResponse.data;

      // Check existing count
      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log('No new programs have been added since the last sync');
        return;
      }

      // Clear the collection
      await this.programModel.deleteMany({});

      // Bulk insert all fetched programs
      if (programs.length > 0) {
        await this.programModel.insertMany(programs);
        console.log(`${programs.length} programs loaded.`);
      } else {
        console.log('No programs found.');
      }
    } catch (error) {
      console.error('Error loading programs:', error?.response?.data || error);
      throw new Error('Failed to load programs.');
    }
  }
}
