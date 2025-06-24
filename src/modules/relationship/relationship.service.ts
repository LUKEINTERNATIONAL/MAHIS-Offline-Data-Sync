import { Injectable } from '@nestjs/common';
import { Relationship, Prisma } from '@prisma/client';
import { PrismaService } from "../prisma/prisma.service";
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class RelationshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService
  ) {}

  async create(data: Prisma.RelationshipCreateInput): Promise<Relationship> {
    return this.prisma.relationship.create({ data });
  }

  async findAll(): Promise<Relationship[]> {
    return this.prisma.relationship.findMany();
  }

  async findById(id: number): Promise<Relationship | null> {
    return this.prisma.relationship.findUnique({ where: { id: id.toString() } });
  }

  async update(id: number, data: Partial<Relationship>): Promise<Relationship | null> {
    return this.prisma.relationship.update({
      where: { id: id.toString() },
      data,
    });
  }

  async delete(id: number): Promise<Relationship | null> {
    return this.prisma.relationship.delete({ where: { id: id.toString() } });
  }
}
