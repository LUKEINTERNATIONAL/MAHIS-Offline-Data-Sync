import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ConceptName,
  ConceptNameDocument,
} from "./schemas/concept-name.schema";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";


@Injectable()
export class ConceptNameService {
  constructor(
    @InjectModel(ConceptName.name)
    private conceptNameModel: Model<ConceptNameDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService
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

  async count(): Promise<number> {
    return this.conceptNameModel.countDocuments().exec();
  }
  async loadConceptNames(count?: number): Promise<void> {
    try {

      const totalDocuments = await this.count();
      if (totalDocuments == count) {
        console.log("no new concepts have been added since the last sync");
        return;
      }
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken();

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

  

      // Step 1: Clear the collection
      await this.conceptNameModel.deleteMany({});

      // Step 2: Insert all fetched concept names
      if (conceptNames.length > 0) {
        await this.conceptNameModel.insertMany(conceptNames);
        console.log(`${conceptNames.length} concept names loaded.`);
      } else {
        console.log("No concept names found.");
      }
    } catch (error) {
      console.error(
        "Error loading concept names:",
        error?.response?.data || error
      );
      throw new Error("Failed to load concept names.");
    }
  }
}
