import { Injectable } from '@nestjs/common';
import { Drug, Prisma } from '@prisma/client';
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DrugService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.DrugCreateInput): Promise<Drug> {
    return this.prisma.drug.create({ data });
  }

  async findAll(): Promise<Drug[]> {
    return this.prisma.drug.findMany();
  }

  async findById(id: number): Promise<Drug | null> {
    return this.prisma.drug.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Drug>): Promise<Drug | null> {
    return this.prisma.drug.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Drug | null> {
    return this.prisma.drug.delete({ where: { id: id.toString() } });
  }
}
