// app.controller.ts
import { Controller, Post, Body, Get, Header } from '@nestjs/common';
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
  async receivePayload(@Body() payload: PayloadDto) {
    // console.log('Received payload:', payload);
    return await this.appService.processPayload(payload);
  }
}