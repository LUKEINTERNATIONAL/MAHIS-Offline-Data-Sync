import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TestType, TestTypeDocument } from "./schema/test-type.schema";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";

@Injectable()
export class TestTypeService {
  constructor(
    @InjectModel(TestType.name)
    private testTypeModel: Model<TestTypeDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async create(data: Partial<TestType>): Promise<TestType> {
    return this.testTypeModel.create(data);
  }

  async findAll(): Promise<TestType[]> {
    return this.testTypeModel.find().exec();
  }

  async findById(concept_id: number): Promise<TestType | null> {
    return this.testTypeModel.findOne({ concept_id }).exec();
  }

  async count(): Promise<number> {
    return this.testTypeModel.countDocuments().exec();
  }

  async loadTestTypes(count?: number): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>("API_BASE_URL");

      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>("API_USERNAME"),
        password: this.configService.get<string>("API_PASSWORD"),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;

      // Fetch test types
      const testTypesResponse$ = this.httpService.get(`${apiUrl}/get_test_types?paginate=false`, {
        headers: { Authorization: token },
      });
      const testTypesResponse = await lastValueFrom(testTypesResponse$);
      const testTypes = testTypesResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === count) {
        console.log("No new test types have been added since the last sync");
        return;
      }

      // Step 1: Clear the collection
      await this.testTypeModel.deleteMany({});

      // Step 2: Insert all fetched test types
      if (testTypes.length > 0) {
        await this.testTypeModel.insertMany(testTypes);
        console.log(`${testTypes.length} test types loaded.`);
      } else {
        console.log("No test types found.");
      }
    } catch (error) {
      console.error("Failed to load test types:", error?.response?.data || error);
      throw new Error("Could not load test types");
    }
  }
}
