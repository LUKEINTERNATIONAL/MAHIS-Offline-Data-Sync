import { Injectable } from "@nestjs/common";
import { Specimen, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class SpecimenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.SpecimenCreateInput): Promise<Specimen> {
    return this.prisma.specimen.create({ data });
  }

  async findAll(): Promise<Specimen[]> {
    return this.prisma.specimen.findMany();
  }

  async findById(id: number): Promise<Specimen | null> {
    return this.prisma.specimen.findUnique({ where: { concept_id: id } });
  }

  async count(): Promise<number> {
    return this.prisma.specimen.count();
  }

  async loadSpecimens(count?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

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

      // Step 1: Clear the table
      await this.prisma.specimen.deleteMany({});

      // Step 2: Insert all fetched specimen records
      if (specimens.length > 0) {
        await this.prisma.specimen.createMany({ data: specimens });
        console.log(`${specimens.length} specimen records loaded.`);
      } else {
        console.log("No specimen records found.");
      }
    } catch (error) {
      console.error("Failed to load specimen:", error?.response?.data || error);
      // throw new Error("Could not load specimen records");
    }
  }
}
