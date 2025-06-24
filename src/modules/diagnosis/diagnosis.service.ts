import { Injectable } from "@nestjs/common";
import { Diagnosis, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "../auth/auth.service";
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.DiagnosisCreateInput): Promise<Diagnosis> {
    return this.prisma.diagnosis.create({ data });
  }

  async findAll(): Promise<Diagnosis[]> {
    return this.prisma.diagnosis.findMany();
  }

  async findById(id: number): Promise<Diagnosis | null> {
    return this.prisma.diagnosis.findUnique({ where: { id: id.toString() } });
  }

  async update(
    id: number,
    data: Partial<Diagnosis>
  ): Promise<Diagnosis | null> {
    return this.prisma.diagnosis.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Diagnosis | null> {
    return this.prisma.diagnosis.delete({ where: { id: id.toString() } });
  }

  async loadDiagnoses(expectedCount?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error("Failed to authenticate");
      }
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

      const totalDocuments = await this.prisma.diagnosis.count();

      if (expectedCount && totalDocuments === expectedCount) {
        console.log("No new diagnoses to update.");
        return;
      }

      // Clear existing
      await this.prisma.diagnosis.deleteMany({});

      // Bulk insert
      if (diagnoses.length > 0) {
        await this.prisma.diagnosis.createMany({ data: diagnoses });
        console.log(`${diagnoses.length} diagnoses loaded.`);
      } else {
        console.log("No diagnoses found.");
      }
    } catch (error) {
      console.error("Error loading diagnoses:", error?.response?.data || error);
      // throw new Error("Failed to load diagnoses.");
    }
  }
}
