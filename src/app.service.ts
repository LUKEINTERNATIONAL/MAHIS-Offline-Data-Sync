import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayloadDto } from './app.controller';
import { Payload } from './payload.entity';
import { generateQRCodeDataURL } from './utils/qrcode.util';
import { getAPIHomePage } from './utils/htmlStr/html_responses';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Payload)
    private payloadRepository: Repository<Payload>,
  ) {}

  async getHome(): Promise<string> {
    // Get port from environment or default to 3009
    const port = process.env.PORT || 3009;
    
    // For the QR code, use the current server address
    const apiUrl = `http://${process.env.HOST || 'localhost'}:${port}/receive-payload`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await generateQRCodeDataURL(apiUrl);
    
    return getAPIHomePage(port, apiUrl, qrCodeDataUrl);
  }

  async processPayload(payloadDto: PayloadDto) {
    // Create a new payload entity
    const payload = new Payload();
    payload.message = payloadDto.message;
    payload.data = payloadDto.data ? JSON.stringify(payloadDto.data) : null;
    payload.timestamp = payloadDto.timestamp || Date.now();

    // Save the payload to the database
    const savedPayload = await this.payloadRepository.save(payload);

    return {
      success: true,
      message: 'Payload received and saved successfully',
      id: savedPayload.id,
      timestamp: new Date().toISOString()
    };
  }
}
