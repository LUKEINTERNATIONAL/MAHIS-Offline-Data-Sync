import { Injectable } from "@nestjs/common";
import { TestResultIndicator, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "../auth/auth.service";
import { lastValueFrom } from 'rxjs';
import { TestTypeService } from "../testTypes/test-type.service";

@Injectable()
export class TestResultIndicatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
    private readonly testTypeService: TestTypeService
  ) {}

  async create(
    data: Prisma.TestResultIndicatorCreateInput
  ): Promise<TestResultIndicator> {
    return this.prisma.testResultIndicator.create({ data });
  }

  async findAll(): Promise<TestResultIndicator[]> {
    return this.prisma.testResultIndicator.findMany();
  }

  async findById(id: number): Promise<TestResultIndicator | null> {
    return this.prisma.testResultIndicator.findUnique({ where: { id: id.toString() } });
  }

  async update(
    id: number,
    data: Partial<TestResultIndicator>
  ): Promise<TestResultIndicator | null> {
    return this.prisma.testResultIndicator.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<TestResultIndicator | null> {
    return this.prisma.testResultIndicator.delete({ where: { id: id.toString() } });
  }

  async loadIndicators(): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error("Failed to authenticate");
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

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

        if (
          !indicators ||
          !Array.isArray(indicators) ||
          indicators.length === 0
        ) {
          console.log(
            `No indicators for test type ${testType.name} (${testType.concept_id})`
          );
          continue;
        }

        for (const indicator of indicators) {
          await this.prisma.testResultIndicator.upsert({
            where: { concept_id: indicator.concept_id },
            update: {
              ...indicator,
              test_type_id: testType.concept_id,
            },
            create: {
              ...indicator,
              test_type_id: testType.concept_id,
            },
          });
        }
        totalIndicators += indicators.length;

        console.log(`Loaded ${indicators.length} indicators for ${testType.name}`);
      }

      console.log(`Total ${totalIndicators} test result indicators loaded.`);
    } catch (error) {
      console.error(
        "Failed to load indicators:",
        error?.response?.data || error
      );
      // throw new Error("Could not load test result indicators");
    }
  }
}
