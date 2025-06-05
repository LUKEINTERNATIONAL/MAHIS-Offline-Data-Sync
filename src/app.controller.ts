// app.controller.ts
import { Controller, Post, Body, Get, Header, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';

// Define a DTO (Data Transfer Object) for the payload
export class PayloadDto {
  readonly message: string;
  readonly data?: any;
  readonly timestamp?: number;
  readonly patientID?: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
    return JSON.parse(payload.data);
  }

  @Get('test-connection')
  testConnection() {
    return this.appService.testConnection();
  }
}