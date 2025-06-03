import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConceptName, ConceptNameDocument } from './schemas/concept-name.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';


@Injectable()
export class ConceptNameService {
  constructor(
    @InjectModel(ConceptName.name) private conceptNameModel: Model<ConceptNameDocument>,
    private httpService: HttpService,
     private configService: ConfigService,
  ) {}

  async create(conceptName: Partial<ConceptName>): Promise<ConceptName> {
    return this.conceptNameModel.create(conceptName);
  }

  async findAll(): Promise<ConceptName[]> {
    return this.conceptNameModel.find().exec();
  }

  async findById(id: number): Promise<ConceptName | null> {
    return this.conceptNameModel.findOne({ conceptName_id: id }).exec();
  }

  async loadConceptNames(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>("API_BASE_URL");
  
     
      const response$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>("API_USERNAME"),
        password: this.configService.get<string>("API_PASSWORD"),
      });
      const authResponse = await lastValueFrom(response$);
      const token = authResponse.data.authorization.token;
  
     
      const conceptResponse$ = this.httpService.get(
        `${apiUrl}/concept_names?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const conceptResponse = await lastValueFrom(conceptResponse$);
      const conceptNames = conceptResponse.data;
  
     
      for (const concept of conceptNames) {
        const { concept_id, name, concept_name_id} = concept;
  
        await this.conceptNameModel.findOneAndUpdate(
          { concept_id },
          {
            concept_id,
            name,
            concept_name_id
          },
          { upsert: true, new: true }
        );
      }
      console.log(`${conceptNames.length} concept names loaded.`);
    } catch (error) {
      console.error("Error loading concept names:", error?.response?.data || error);
      throw new Error("Failed to load concept names.");
    }
  }
  
}
