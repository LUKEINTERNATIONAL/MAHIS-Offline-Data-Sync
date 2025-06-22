// server-patient-count.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServerPatientCountService {
  constructor(private prisma: PrismaService) {}

  async create(data: { server_patient_count: number }) {
    return this.prisma.serverPatientCount.create({
      data
    });
  }

  async findAll() {
    return this.prisma.serverPatientCount.findMany();
  }

  async findOne(id: number) {
    return this.prisma.serverPatientCount.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: { server_patient_count: number }) {
    return this.prisma.serverPatientCount.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    return this.prisma.serverPatientCount.delete({
      where: { id }
    });
  }
}