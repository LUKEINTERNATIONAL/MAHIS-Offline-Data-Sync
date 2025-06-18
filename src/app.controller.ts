// app.controller.ts
import { Controller, Post, Body, Get, Header, Param, NotFoundException, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PatientService } from './modules/patient/patient.service';
import { DDEService } from './modules/dde/ddde.service';
import { VisitService } from './modules/visit/visit.service';
import { StageService } from './modules/stage/stage.service';

// Define a DTO (Data Transfer Object) for the payload
export class PayloadDto {
  readonly message: string;
  readonly data?: any;
  readonly timestamp?: number;
  readonly patientID?: string;
  readonly ID?: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly patientService: PatientService,
    private readonly ddeService: DDEService,
    private readonly visitService: VisitService,
    private readonly stageService: StageService
  ) {}

  @Get()
  @Header('Content-Type', 'text/html')
  async getHome(): Promise<string> {
    return await this.appService.getHome();
  }

  @Post('receive-payload')
  async receivePayload(@Body() payload: PayloadDto | PayloadDto[]) {
    // Convert single payload to array if needed
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    return await this.appService.processPayload(payloadArray);
  }

  @Get('patient-ids')
  async getAllPatientIds(): Promise<string[]> {
    return await this.appService.getAllPatientIds();
  }

  @Get('patient/:patientId/payload')
  async getPatientPayload(@Param('patientId') patientId: string) {
    const payload = await this.appService.getPatientPayload(patientId);
    if (!payload) {
      throw new NotFoundException(`Payload not found for patient ID ${patientId}`);
    }
    return payload.data;
  }

  @Get('test-connection')
  testConnection() {
    return this.appService.testConnection();
  }

  @Get('unassigned-npid')
  getUnassignedNpid() {
    return this.ddeService.findRandomWithNullStatus();
  }

  @Get('visits')
  getVisits() {
    return this.visitService.findAll();
  }

  @Get('stages')
  getStages() {
    return this.stageService.findAll();
  }

  @Get('search')
  async searchPatients(
    @Query('given_name') given_name?: string,
    @Query('family_name') family_name?: string,
    @Query('gender') gender?: string,
    @Query('page') page?: string,
    @Query('per_page') per_page?: string,
  ) {
    const searchCriteria = { given_name, family_name, gender };
    
    // Remove undefined values
    Object.keys(searchCriteria).forEach(key => 
      searchCriteria[key] === undefined && delete searchCriteria[key]
    );
    
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      per_page: per_page ? parseInt(per_page, 10) : 10
    };
    
    return this.patientService.searchPatientData(searchCriteria, pagination);
  }
}