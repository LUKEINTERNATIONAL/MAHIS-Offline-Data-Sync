// app.controller.ts
import { Controller, Post, Body, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

// Define a DTO (Data Transfer Object) for the payload
export class PayloadDto {
  readonly message: string;
  readonly data?: any;
  readonly timestamp?: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('receive-payload')
  receivePayload(@Body() payload: PayloadDto) {
    console.log('Received payload:', payload);
    return this.appService.processPayload(payload);
  }
}