import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Patient } from './schema/patient.schema';


@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async create(@Body() body: Partial<Patient>) {
    return this.patientService.create(body);
  }

  @Get()
  async findAll() {
    return this.patientService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.patientService.findById(Number(id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<Patient>) {
    return this.patientService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.patientService.delete(Number(id));
  }
}
