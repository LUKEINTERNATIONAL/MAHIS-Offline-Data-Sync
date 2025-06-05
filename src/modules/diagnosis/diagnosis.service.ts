import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Diagnosis, DiagnosisDocument } from "./schema/diagnosis.schema";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(Diagnosis.name)
    private diagnosisModel: Model<DiagnosisDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  async create(data: Partial<Diagnosis>): Promise<Diagnosis> {
    return this.diagnosisModel.create(data);
  }

  async findAll(): Promise<Diagnosis[]> {
    return this.diagnosisModel.find().exec();
  }

  async findById(id: number): Promise<Diagnosis | null> {
    return this.diagnosisModel.findOne({ id }).exec();
  }

  async count(): Promise<number> {
    return this.diagnosisModel.countDocuments().exec();
  }

  async update(
    id: number,
    data: Partial<Diagnosis>
  ): Promise<Diagnosis | null> {
    return this.diagnosisModel
      .findOneAndUpdate({ id }, data, { new: true })
      .exec();
  }

  async delete(id: number): Promise<Diagnosis | null> {
    return this.diagnosisModel.findOneAndDelete({ id }).exec();
  }

  async loadDiagnoses(expectedCount?: number): Promise<void> {
    try {
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      // Fetch diagnoses
      const diagnosesResponse$ = this.httpService.get(
        `${apiUrl}/diagnosis?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const diagnosesResponse = await lastValueFrom(diagnosesResponse$);
      const diagnoses = diagnosesResponse.data;

      const totalDocuments = await this.count();

      if (expectedCount && totalDocuments === expectedCount) {
        console.log("No new diagnoses to update.");
        return;
      }

      // Clear existing
      await this.diagnosisModel.deleteMany({});

      // Bulk insert
      if (diagnoses.length > 0) {
        await this.diagnosisModel.insertMany(diagnoses);
        console.log(`${diagnoses.length} diagnoses loaded.`);
      } else {
        console.log("No diagnoses found.");
      }
    } catch (error) {
      console.error("Error loading diagnoses:", error?.response?.data || error);
      throw new Error("Failed to load diagnoses.");
    }
  }
}
