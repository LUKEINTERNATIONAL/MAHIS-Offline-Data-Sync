import { Controller, Get, Post, Param, Body, Put, Delete, Query, HttpStatus, HttpException } from '@nestjs/common';
import { PatientService } from './patient.service';
import { Patient } from '@prisma/client'; // Fixed import - should be from Prisma client, not schema

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async create(@Body() body: Partial<Patient>) {
    try {
      return await this.patientService.create(body);
    } catch (error) {
      throw new HttpException('Failed to create patient', HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll() {
    return await this.patientService.findAll();
  }

  // Get all patient IDs
  @Get('ids')
  async getAllPatientIDs() {
    return await this.patientService.getAllPatientIDs();
  }

  // Search patients with pagination
  @Get('search')
  async searchPatients(
    @Query('given_name') given_name?: string,
    @Query('family_name') family_name?: string,
    @Query('gender') gender?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    const searchCriteria = {};
    if (given_name) searchCriteria['given_name'] = given_name;
    if (family_name) searchCriteria['family_name'] = family_name;
    if (gender) searchCriteria['gender'] = gender;

    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      per_page: per_page ? parseInt(per_page, 10) : 10,
    };

    return await this.patientService.searchPatientDataWithRawQuery(searchCriteria, pagination);
  }

  // Find duplicates by data ID
  @Get('duplicates/:dataId')
  async findDuplicates(@Param('dataId') dataId: string) {
    return await this.patientService.findDuplicatesByDataId(dataId);
  }

  // Deduplicate by data ID
  @Delete('duplicates/:dataId')
  async deduplicateByDataId(@Param('dataId') dataId: string) {
    return await this.patientService.findAndDeduplicateByDataId(dataId);
  }

  // Find by MongoDB's _id (ObjectId) - More specific route first
  @Get('by-id/:id')
  async findById(@Param('id') id: string) {
    const patient = await this.patientService.findById(id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }

  // Update by MongoDB's _id - More specific route first
  @Put('by-id/:id')
  async updateById(@Param('id') id: string, @Body() body: Partial<Patient>) {
    const patient = await this.patientService.updateById(id, body);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }

  // Delete by MongoDB's _id - More specific route first
  @Delete('by-id/:id')
  async deleteById(@Param('id') id: string) {
    const patient = await this.patientService.deleteById(id);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }

  // Find by patientID (custom unique field) - Generic route last
  @Get(':patientId')
  async findByPatientId(@Param('patientId') patientId: string) {
    const patient = await this.patientService.findByPatientId(patientId);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }

  // Update by patientID (custom unique field) - Generic route last
  @Put(':patientId')
  async updateByPatientId(@Param('patientId') patientId: string, @Body() body: Partial<Patient>) {
    const patient = await this.patientService.updateByPatientId(patientId, body);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }

  // Delete by patientID (custom unique field) - Generic route last
  @Delete(':patientId')
  async deleteByPatientId(@Param('patientId') patientId: string) {
    const patient = await this.patientService.deleteByPatientId(patientId);
    if (!patient) {
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }
    return patient;
  }
}