import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Specimen, SpecimenDocument } from "./schema/specimen.schema";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class SpecimenService {
  constructor(
    @InjectModel(Specimen.name)
    private specimenModel: Model<SpecimenDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Specimen>): Promise<Specimen> {
    return this.specimenModel.create(data);
  }

  async findAll(): Promise<Specimen[]> {
    return this.specimenModel.find().exec();
  }

  async findById(id: number): Promise<Specimen | null> {
    return this.specimenModel.findOne({ concept_id: id }).exec();
  }

  async count(): Promise<number> {
    return this.specimenModel.countDocuments().exec();
  }

  async loadSpecimens(count?: number): Promise<void> {
    try {
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

      const specimenRes$ = this.httpService.get(`${apiUrl}/lab/specimen_types?paginate=false`, {
        headers: {
          Authorization: token,
        },
      });
      const specimenRes = await lastValueFrom(specimenRes$);
      const specimens = specimenRes.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log("No new specimen records have been added since the last sync");
        return;
      }

      // Step 1: Clear the collection
      await this.specimenModel.deleteMany({});

      // Step 2: Insert all fetched specimen records
      if (specimens.length > 0) {
        await this.specimenModel.insertMany(specimens);
        console.log(`${specimens.length} specimen records loaded.`);
      } else {
        console.log("No specimen records found.");
      }
    } catch (error) {
      console.error("Failed to load specimen:", error?.response?.data || error);
      throw new Error("Could not load specimen records");
    }
  }
}
