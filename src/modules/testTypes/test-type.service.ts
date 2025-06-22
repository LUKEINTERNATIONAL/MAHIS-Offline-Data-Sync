import { Injectable } from "@nestjs/common";
import { TestType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from "@nestjs/axios";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class TestTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.TestTypeCreateInput): Promise<TestType> {
    return this.prisma.testType.create({ data });
  }

  async findAll(): Promise<TestType[]> {
    return this.prisma.testType.findMany();
  }

  async findById(id: string): Promise<TestType | null> {
    return this.prisma.testType.findUnique({ where: { id } });
  }

  async update(id: string, data: Partial<TestType>): Promise<TestType | null> {
    return this.prisma.testType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<TestType | null> {
    return this.prisma.testType.delete({ where: { id } });
  }
}
