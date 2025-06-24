import { Injectable } from '@nestjs/common';
import { Program, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.ProgramCreateInput): Promise<Program> {
    return this.prisma.program.create({ data });
  }

  async findAll(): Promise<Program[]> {
    return this.prisma.program.findMany();
  }

  async findById(id: number): Promise<Program | null> {
    return this.prisma.program.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Program>): Promise<Program | null> {
    return this.prisma.program.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Program | null> {
    return this.prisma.program.delete({ where: { id: id.toString() } });
  }
}
