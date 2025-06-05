import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  TestResultIndicator,
  TestResultIndicatorDocument,
} from "./schema/test-result-indicator.schema";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { TestTypeService } from "../testTypes/test-type.service";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class TestResultIndicatorService {
  constructor(
    @InjectModel(TestResultIndicator.name)
    private testResultIndicatorModel: Model<TestResultIndicatorDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
    private testTypeService: TestTypeService,
    private authService: AuthService
  ) {}

  async create(
    data: Partial<TestResultIndicator>
  ): Promise<TestResultIndicator> {
    return this.testResultIndicatorModel.create(data);
  }

  async findAll(): Promise<TestResultIndicator[]> {
    return this.testResultIndicatorModel.find().exec();
  }

  async findById(id: number): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel.findOne({ id }).exec();
  }

  async update(
    id: number,
    data: Partial<TestResultIndicator>
  ): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel
      .findOneAndUpdate({ id }, data, { new: true })
      .exec();
  }

  async delete(id: number): Promise<TestResultIndicator | null> {
    return this.testResultIndicatorModel.findOneAndDelete({ id }).exec();
  }

  async loadIndicators(): Promise<void> {
    try {
      const apiUrl = this.authService.getBaseUrl()
      const token = this.authService.getAuthToken()

      const testTypes = await this.testTypeService.findAll();

      if (!testTypes.length) {
        console.log("No test types found.");
        return;
      }

      let totalIndicators = 0;

      for (const testType of testTypes) {
        if (!testType?.concept_id) continue;

        const indicatorsRes$ = this.httpService.get(
          `${apiUrl}/lab/test_result_indicators`,
          {
            params: {
              test_type_id: testType.concept_id,
            },
            headers: {
              Authorization: token,
            },
          }
        );
        const indicatorsRes = await lastValueFrom(indicatorsRes$);
        const indicators = indicatorsRes.data;

        if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
          console.log(`No indicators for test type ${testType.name} (${testType.concept_id})`);
          continue;
        }

        const bulkOps = indicators.map(({ concept_id, ...rest }) => ({
          updateOne: {
            filter: { concept_id },
            update: { $set: { concept_id, test_type_id:testType.concept_id, ...rest } },
            upsert: true,
          },
        }));

        await this.testResultIndicatorModel.bulkWrite(bulkOps);
        totalIndicators += bulkOps.length;

        console.log(`Loaded ${bulkOps.length} indicators for ${testType.name}`);
      }

      console.log(`Total ${totalIndicators} test result indicators loaded.`);
    } catch (error) {
      console.error(
        "Failed to load indicators:",
        error?.response?.data || error
      );
      throw new Error("Could not load test result indicators");
    }
  }
}
