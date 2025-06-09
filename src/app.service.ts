import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './modules/patient/schema/patient.schema';
import { PayloadDto } from './app.controller';
import { generateQRCodeDataURL } from './utils/qrcode.util';
import { getAPIHomePage } from './utils/htmlStr/html_responses';
import { sophisticatedMergePatientData } from './utils/patient_record_utils';
import { DataSyncService } from './app.dataSyncService';
import { PatientService } from './modules/patient/patient.service';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    private readonly dataSyncService: DataSyncService,
    private readonly patientService: PatientService,
  ) {}

  async getHome(): Promise<string> {
    const port = process.env.PORT || 3009;
    const apiUrl = `http://${process.env.HOST || '192.168.0.105'}:${port}/receive-payload`;
    const qrCodeDataUrl = await generateQRCodeDataURL(apiUrl);
    return getAPIHomePage(port, apiUrl, qrCodeDataUrl);
  }

  async processPayload(payloadDtos: PayloadDto[]) {
    const results = [];
    
    for (const payloadDto of payloadDtos) {
      try {
        const patientId = payloadDto.ID;
        
        if (!patientId) {
          throw new Error('Patient ID is required');
        }

        // Check if patient record already exists
        const existingPatient = await this.patientModel.findOne({ 
          patientID: patientId 
        });

        let hasChanges = false;

        if (existingPatient) {
          try {
            // Parse the incoming payload data
            const newData = payloadDto;
            
            // Parse existing data or use empty object if parsing fails
            let existingData = {};
            try {
              existingData = existingPatient.data ? existingPatient.data : {};
            } catch (e) {
              console.log("Existing data was empty or invalid JSON");
            }
          
            // If existing data is empty, use new data directly
            const result = Object.keys(existingData).length === 0 
              ? { mergedData: newData, hasChanges: false }
              : sophisticatedMergePatientData(existingData as any, newData as any) as any;
            
            hasChanges = result.hasChanges;

            // Update existing patient record
            const updatedPatient = await this.patientModel.findOneAndUpdate(
              { patientID: patientId },
              { 
                data: result.mergedData,
                timestamp: payloadDto.timestamp || Date.now(),
                message: 'Updated payload'
              },
              { new: true }
            );

            const patient_result = await this.dataSyncService.syncPatientRecord(patientId)
            const resultPayload = {
              success: true,
              message: 'Payload updated successfully',
              id: updatedPatient._id,
              patientID: updatedPatient.patientID,
              timestamp: new Date().toISOString(),
              updated: true,
              record: patient_result,
              hasChanges: true,
              id_to_remove: null,
            }
            try {
              if (patientId.toString() !== patient_result.ID.toString) {
                this.patientService.deleteByPatientId(patientId.toString());
                resultPayload.id_to_remove = patientId;
              }
            } catch (error) {
              
            }

            results.push(resultPayload);
          } catch (e) {
            console.error('Error parsing payload data:', e);
            // throw e;
          }
        } else {
          // Create new patient record
          const newPatient = await this.patientModel.create({
            patientID: patientId,
            data: payloadDto,
            timestamp: payloadDto.timestamp || Date.now(),
            message: 'Received payload'
          });

          const patient_result = await this.dataSyncService.syncPatientRecord(patientId)
          const resultPayload = {
            success: true,
            message: 'Payload received and saved successfully',
            id: newPatient._id,
            patientID: newPatient.data.ID,
            timestamp: new Date().toISOString(),
            updated: false,
            record: patient_result,
            hasChanges: true,
            id_to_remove: null
          }
          try {
            if (patientId.toString() !== patient_result.ID.toString) {
              this.patientService.deleteByPatientId(patientId.toString());
              resultPayload.id_to_remove = patientId;
            }
          } catch (error) {}

          results.push(resultPayload);
        }
      } catch (error) {
        console.error('Error processing payload:', error);
        results.push({
          success: false,
          message: 'Error processing payload',
          patientID: payloadDto.patientID,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    }
  
    return results;
  }

  async getAllPatientIds(): Promise<string[]> {
    return this.patientService.getAllPatientIDs();
  }

  async getPatientPayload(patientId: string) {
    const patient = await this.patientModel.findOne({ patientID: patientId });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }
    return patient;
  }

  async testConnection() {
    return {
      connection_status: 'available',
      timestamp: new Date().toISOString()
    };
  }

  async savePatientRecordToAPI(record: any) {

  }
}
