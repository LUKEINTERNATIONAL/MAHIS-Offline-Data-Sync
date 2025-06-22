import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConceptSet, Prisma } from "@prisma/client";

@Injectable()
export class ConceptSetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.ConceptSetCreateInput): Promise<ConceptSet> {
    return this.prisma.conceptSet.create({ data });
  }

  async findAll(): Promise<ConceptSet[]> {
    return this.prisma.conceptSet.findMany();
  }

  async findById(id: number): Promise<ConceptSet | null> {
    return this.prisma.conceptSet.findUnique({ where: { id: id.toString() } });
  }

  async count(): Promise<number> {
    return this.prisma.conceptSet.count();
  }

  async loadConceptSet(expectedCount?: number): Promise<void> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        // this.logger.error("Failed to authenticate")
      }
      const apiUrl = this.authService.getBaseUrl();
      const token = this.authService.getAuthToken();

      const conceptSetResponse$ = this.httpService.get(
        `${apiUrl}/concept_sets_ids?paginate=false`,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      const conceptSetResponse = await lastValueFrom(conceptSetResponse$);
      const conceptSets = conceptSetResponse.data;

      const totalDocuments = await this.count();

      if (totalDocuments === expectedCount) {
        console.log("No new concept sets have been added since the last sync.");
        return;
      }

      // Step 1: Clear the table
      await this.prisma.conceptSet.deleteMany({});

      // Step 2: Insert all fetched concept sets
      if (conceptSets.length > 0) {
        await this.prisma.conceptSet.createMany({ data: conceptSets });
        console.log(`${conceptSets.length} concept sets loaded.`);
      } else {
        console.log("No concept sets found.");
      }
    } catch (error) {
      console.error("Error loading concept sets:", error?.response?.data || error);
      // throw new Error("Failed to load concept sets.");
    }
  }
}
