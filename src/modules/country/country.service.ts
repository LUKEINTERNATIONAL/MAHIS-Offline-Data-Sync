import { Injectable } from '@nestjs/common';
import { Country, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CountryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.CountryCreateInput): Promise<Country> {
    return this.prisma.country.create({ data });
  }

  async findAll(): Promise<Country[]> {
    return this.prisma.country.findMany();
  }

  async findById(id: number): Promise<Country | null> {
    return this.prisma.country.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Country>): Promise<Country | null> {
    return this.prisma.country.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Country | null> {
    return this.prisma.country.delete({ where: { id: id.toString() } });
  }
}
