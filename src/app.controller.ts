// app.controller.ts
import { Controller, Post, Body, Get, Header, Param, NotFoundException, BadRequestException, Query, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { PatientService } from './modules/patient/patient.service';
import { DDEService } from './modules/dde/ddde.service';
import { VisitService } from './modules/visit/visit.service';
import { StageService } from './modules/stage/stage.service';
import { ServerTimeService } from './app.serverTimeService';
import { LiveAPIService } from './app.liveAPIService';
import { UnsavedVisitsService } from './modules/unsavedVisits/unsavedVisit.service';

// Define a DTO (Data Transfer Object) for the payload
export class PayloadDto {
  readonly message: string;
  readonly data?: any;
  readonly timestamp?: any;
  readonly patientID?: string;
  readonly ID?: string;
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly patientService: PatientService,
    private readonly ddeService: DDEService,
    private readonly visitService: VisitService,
    private readonly stageService: StageService,
    private readonly serverTimeService: ServerTimeService,
    private readonly liveAPIService: LiveAPIService,
    private readonly unsavedVisitsService: UnsavedVisitsService,
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

  @Post('is-patient-possible-duplicate')
  async isPatientPossibleDuplicate(@Body() payload: PayloadDto): Promise<any> {
    if (!payload || !payload.data) {
      throw new BadRequestException('Invalid payload format. Expected payload with data.');
    }
    return await this.patientService.isPatientPossibleDuplicate(payload.data);
  }   

  @Get('patient/:patientId/payload')
async getPatientPayload(@Param('patientId') patientId: string) {
  const payload = await this.appService.getPatientPayload(patientId);

  if (!payload || !payload.data) {
    throw new NotFoundException(`Payload not found for patient ID ${patientId}`);
  }

  try {
    // If payload.data is already an object, this won't throw.
    // If it's a JSON string, this will parse it.
    const parsedData = typeof payload.data === 'string'
      ? JSON.parse(payload.data)
      : payload.data;

    return parsedData;
  } catch (error) {
    throw new BadRequestException(`Invalid JSON data for patient ID ${patientId}`);
  }
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
  async getVisits() {
    const visits = await this.visitService.findAll();
    return visits.map(visit => visit.data);
  }

  @Get('stages')
  async getStages() {
    const stages = await this.stageService.findAll();
    return stages.map(stage => stage.data);
  }

  @Get('todays-visits')
  async getTodaysVisits(
    @Query('programId') programId: string,
    @Query('date') date?: string, // Make the date parameter optional
  ) {
    if (!programId) {
      throw new BadRequestException('programId query parameter is required.');
    }

    let queryDate: string;

    // Check if a date was provided in the query
    if (date) {
      // Use the provided date
      queryDate = date;
      this.logger.log(`Using provided date: ${queryDate}`);
    } else {
      // Fall back to the current server date
      const serverTimeData = this.serverTimeService.getStoredServerTimeData();
      if (!serverTimeData || !serverTimeData.date) {
        throw new BadRequestException('Server date is not available.');
      }
      queryDate = serverTimeData.date;
      this.logger.log(`Using server's local date: ${queryDate}`);
    }

    try {
      const visits = await this.visitService.getTodaysVisits(programId, queryDate);
      return visits;
    } catch (error) {
      this.logger.error(`Failed to fetch visits for programId: ${programId} on date: ${queryDate}`, error.stack);
      throw error;
    }
  }

  @Get('visits/active')
  async getActiveVisits(
    @Query('programId') programId: string,
    @Query('patientId') patientId: string,
  ) {
    if (!programId || !patientId) {
      throw new BadRequestException('Both programId and patientId query parameters are required.');
    }

    this.logger.log(`Fetching active visits for program: ${programId} and patient: ${patientId}`);
    
    const visits = await this.visitService.getActiveVisits(programId, patientId);
    return visits;
  }

  @Get('visits/by-data-id')
  async getVisitByDataId(
    @Query('id') id: string,
  ): Promise<any> {
    if (!id) {
      throw new BadRequestException('The "id" query parameter is required.');
    }

    this.logger.log(`Fetching visit by data.id: ${id}`);
    
    const visit = await this.visitService.getVisitById(id);
    return visit;
  }

    @Get('by-identifier')
  async getUnsavedVisitByIdentifier(
    @Query('identifier') identifier: string,
  ): Promise<any> {
    if (!identifier) {
      throw new BadRequestException('The "identifier" query parameter is required.');
    }

    this.logger.log(`Fetching unsaved visit for identifier: ${identifier}`);
    
    const unsavedVisit = await this.unsavedVisitsService.getUnsavedVisitByIdentifier(identifier);
    return unsavedVisit;
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
    
    return this.patientService.searchPatientDataWithRawQuery(searchCriteria, pagination);
  }

  /**
   * Get stored server time data without API call
   */
  @Get('bare-bones-session-date-time')
  getStoredTime() {
      return this.serverTimeService.getStoredServerTimeData();
  }

  /**
   * Get status information
   */
  @Get('session-date-time')
  getStatus() {
      const timeSinceUpdate = this.serverTimeService.getTimeSinceLastUpdate();
      const storedData = this.serverTimeService.getStoredServerTimeData();
      
      return {
        data: {
          hasStoredData: !!storedData,
          timeSinceLastUpdateMinutes: timeSinceUpdate,
          storedData: storedData,
        }
      };
  }

  @Get('live-api-health')
  async getLiveAPIHealth() {
    return await this.liveAPIService.getAPIHealthCheck();
  }
}