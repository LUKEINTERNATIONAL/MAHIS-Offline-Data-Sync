import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConceptSet, ConceptSetDocument } from "./schema/concept-set.schema";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "../../app.authService";
import { lastValueFrom } from "rxjs";

@Injectable()
export class ConceptSetService {
  constructor(
    @InjectModel(ConceptSet.name)
    private conceptSetModel: Model<ConceptSetDocument>,
    private configService: ConfigService,
    private httpService: HttpService
  ) // private authService: AuthService
  {}

  async create(data: Partial<ConceptSet>): Promise<ConceptSet> {
    return this.conceptSetModel.create(data);
  }

  async findAll(): Promise<ConceptSet[]> {
    return this.conceptSetModel.find().exec();
  }

  async findById(id: number): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOne({ id }).exec();
  }

  async update(
    id: number,
    data: Partial<ConceptSet>
  ): Promise<ConceptSet | null> {
    return this.conceptSetModel
      .findOneAndUpdate({ id }, data, { new: true })
      .exec();
  }

  async delete(id: number): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOneAndDelete({ id }).exec();
  }

  async loadConceptSet() {
    try {
      const apiUrl = this.configService.get<string>("API_BASE_URL");
      const response$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>("API_USERNAME"),
        password: this.configService.get<string>("API_PASSWORD"),
      });
      const authResponse = await lastValueFrom(response$);
      const token = authResponse.data.authorization.token;
  
      const conceptResponse$ = this.httpService.get(
        `${apiUrl}/concept_sets_ids?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
  
      const response = await lastValueFrom(conceptResponse$);
      const conceptSets = response.data;
  
      for (const conceptSet of conceptSets) {
        const { id, concept_set_name, member_ids } = conceptSet;
        await this.conceptSetModel.findOneAndUpdate(
          { id },
          {
            id,
            concept_set_name,
            member_ids,
          },
          { upsert: true, new: true }
        );
      }
  
      return { message: `${conceptSets.length} concept sets loaded.` };
    } catch (error) {
      console.error("Error loading concept sets:", error?.response?.data || error);
      throw new Error("Failed to load concept sets.");
    }
  }
  
}
