import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly payloadRepository: Repository<Payload>,
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
        let patient_record = payload.data

        let existingData;
        try {
          existingData = existingPayload.data ? JSON.parse(existingPayload.data) : {};
        } catch (e) {
          existingData = {};
        }

        if (existingData && Object.keys(existingData).length === 0) {
          console.log("Object is empty");
        } else if (existingData && Object.keys(existingData).length > 0) {
          patient_record = sophisticatedMergePatientData( JSON.parse(existingPayload.data) as any, JSON.parse(payload.data) as any) as any;
        }

        try {
          // Parse the incoming payload data
          const newData = JSON.parse(payload.data);
          
          // Parse existing data or use empty object if parsing fails
          let existingData = {};
          try {
            existingData = existingPayload.data ? JSON.parse(existingPayload.data) : {};
          } catch (e) {
            console.log("Existing data was empty or invalid JSON");
          }
        
          // If existing data is empty, use new data directly
          const patient_record = Object.keys(existingData).length === 0 
            ? newData 
            : sophisticatedMergePatientData(existingData as any, newData);
        
          existingPayload.data = JSON.stringify(patient_record);
        } catch (e) {
          console.error('Error parsing payload data:', e);
          throw e;
        }

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

  async getAllPatientIds(): Promise<string[]> {
    const payloads = await this.payloadRepository.find({
      select: ['patientID']
    });
    return payloads.map(payload => payload.patientID);
  }

  async getPatientPayload(patientId: string) {
    const payload = await this.payloadRepository.findOne({
      where: { patientID: patientId }
    });
    
    return payload;
  }
}
