import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Patient } from './schema/patient.schema';

@Controller('api/v1/patients')
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

  // Find by MongoDB's _id (ObjectId)
  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    return this.patientService.findById(id);
  }

  // Find by patientID (your custom unique field)
  @Get(':patientId')
  async findByPatientId(@Param('patientId') patientId: string) {
    return this.patientService.findByPatientId(patientId);
  }

  // Update by MongoDB's _id
  @Put('by-id/:id')
  async updateById(@Param('id') id: string, @Body() body: Partial<Patient>) {
    return this.patientService.updateById(id, body);
  }

  // Update by patientID (your custom unique field)
  @Put(':patientId')
  async updateByPatientId(@Param('patientId') patientId: string, @Body() body: Partial<Patient>) {
    return this.patientService.updateByPatientId(patientId, body);
  }

  // Delete by MongoDB's _id
  @Delete('by-id/:id')
  async deleteById(@Param('id') id: string) {
    return this.patientService.deleteById(id);
  }

  // Delete by patientID (your custom unique field)
  @Delete(':patientId')
  async deleteByPatientId(@Param('patientId') patientId: string) {
    return this.patientService.deleteByPatientId(patientId);
  }
}
