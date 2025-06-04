import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Diagnosis, DiagnosisDocument } from "./schema/diagnosis.schema";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectModel(Diagnosis.name)
    private diagnosisModel: Model<DiagnosisDocument>,
    private configService: ConfigService,
    private httpService: HttpService
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

  async loadDiagnoses(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>("API_BASE_URL");

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>("API_USERNAME"),
        password: this.configService.get<string>("API_PASSWORD"),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch diagnoses
      const diagnosesResponse$ = this.httpService.get(
        `${apiUrl}/diagnosis?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
          data: {
            id: 7409,
          },
        }
      );
      const diagnosesResponse = await lastValueFrom(diagnosesResponse$);
      const diagnoses = diagnosesResponse.data;

      for (const diagnosis of diagnoses) {
        const { concept_id, ...rest } = diagnosis;

        await this.diagnosisModel.findOneAndUpdate(
          { concept_id },
          { concept_id, ...rest },
          { upsert: true, new: true }
        );
      }

      console.log(`${diagnoses.length} diagnoses loaded.`);
    } catch (error) {
      console.error("Error loading diagnoses:", error?.response?.data || error);
      throw new Error("Failed to load diagnoses.");
    }
  }
}
