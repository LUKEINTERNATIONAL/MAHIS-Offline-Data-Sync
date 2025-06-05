import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConceptSet, ConceptSetDocument } from "./schema/concept-set.schema";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class ConceptSetService {
  constructor(
    @InjectModel(ConceptSet.name)
    private conceptSetModel: Model<ConceptSetDocument>,
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async create(data: Partial<ConceptSet>): Promise<ConceptSet> {
    return this.conceptSetModel.create(data);
  }

  async findAll(): Promise<ConceptSet[]> {
    return this.conceptSetModel.find().exec();
  }

  async findById(id: number): Promise<ConceptSet | null> {
    return this.conceptSetModel.findOne({ id }).exec();
  }

  async count(): Promise<number> {
    return this.conceptSetModel.countDocuments().exec();
  }

  async loadConceptSet(expectedCount?: number): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>("API_BASE_URL");

      const loginResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>("API_USERNAME"),
        password: this.configService.get<string>("API_PASSWORD"),
      });
      const authResponse = await lastValueFrom(loginResponse$);
      const token = authResponse.data.authorization.token;

      const conceptSetResponse$ = this.httpService.get(
        `${apiUrl}/concept_sets_ids?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const conceptSetResponse = await lastValueFrom(conceptSetResponse$);
      const conceptSets = conceptSetResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === expectedCount) {
        console.log("No new concept sets have been added since the last sync.");
        return;
      }

      // Step 1: Clear the collection
      await this.conceptSetModel.deleteMany({});

      // Step 2: Insert all fetched concept sets
      if (conceptSets.length > 0) {
        await this.conceptSetModel.insertMany(conceptSets);
        console.log(`${conceptSets.length} concept sets loaded.`);
      } else {
        console.log("No concept sets found.");
      }
    } catch (error) {
      console.error("Error loading concept sets:", error?.response?.data || error);
      throw new Error("Failed to load concept sets.");
    }
  }
}
