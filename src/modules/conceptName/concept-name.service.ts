import { Injectable } from "@nestjs/common";
import { PrismaService } from '../prisma/prisma.service';
import { ConceptName } from "@prisma/client";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { Prisma } from "@prisma/client";


@Injectable()
export class ConceptNameService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async create(conceptName: Prisma.ConceptNameCreateInput): Promise<ConceptName> {
    return this.prisma.conceptName.create({ data: conceptName });
  }

  async findAll(): Promise<ConceptName[]> {
    return this.prisma.conceptName.findMany();
  }

  async findById(id: number): Promise<ConceptName | null> {
    return this.prisma.conceptName.findUnique({ where: { concept_name_id: id } });
  }

  async count(): Promise<number> {
    return this.prisma.conceptName.count();
  }
  async loadConceptNames(count?: number): Promise<void> {
    try {

      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        // this.logger.error("Failed to authenticate")
      }

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

      // Step 1: Clear the table
      await this.prisma.conceptName.deleteMany();

      // Step 2: Insert all fetched concept names
      if (conceptNames.length > 0) {
        await this.prisma.conceptName.createMany({ data: conceptNames });
        console.log(`${conceptNames.length} concept names loaded.`);
      } else {
        console.log("No concept names found.");
      }
    } catch (error) {
      console.error(
        "Error loading concept names:",
        error?.response?.data || error
      );
      // throw new Error("Failed to load concept names.");
    }
  }
}
