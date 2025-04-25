import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayloadDto } from './app.controller';
import { Payload } from './payload.entity';
import { generateQRCodeDataURL } from './utils/qrcode.util';
import { getAPIHomePage } from './utils/htmlStr/html_responses';
import { sophisticatedMergePatientData } from './utils/patient_record_utils'

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
    payload.message = 'Received payload';
    payload.data = payloadDto? JSON.stringify(payloadDto) : null;
    payload.timestamp = payloadDto.timestamp || Date.now();
    
    // Extract patientID from payload data or use from DTO if provided directly
    if (payloadDto.patientID) {
      payload.patientID = payloadDto.patientID;
    } else if (payloadDto.data && payloadDto.data.patientID) {
      payload.patientID = payloadDto.data.patientID;
    }
  
    try {
      // Check if patient record already exists
      const existingPayload = await this.payloadRepository.findOne({
        where: { patientID: payload.patientID }
      });

      if (existingPayload) {
        // Update existing record
        existingPayload.data = sophisticatedMergePatientData(existingPayload.data as any, payload.data as any) as any;
        existingPayload.timestamp = payload.timestamp;
        existingPayload.message = 'Updated payload';
        
        const updatedPayload = await this.payloadRepository.save(existingPayload);
        return {
          success: true,
          message: 'Payload updated successfully',
          id: updatedPayload.id,
          patientID: updatedPayload.patientID,
          timestamp: new Date().toISOString(),
          updated: true,
          record: existingPayload.data,
        };
      }

      // Save new payload if no existing record found
      const savedPayload = await this.payloadRepository.save(payload);
      return {
        success: true,
        message: 'Payload received and saved successfully',
        id: savedPayload.id,
        patientID: savedPayload.patientID,
        timestamp: new Date().toISOString(),
        updated: false
      };
    } catch (error) {
      console.error('Error processing payload:', error);
      throw error;
    }
  }
}
