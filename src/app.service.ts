import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PayloadDto } from './app.controller';
import { generateQRCodeDataURL } from './utils/qrcode.util';
import { getAPIHomePage } from './utils/htmlStr/html_responses';
import { sophisticatedMergePatientData } from './utils/patient_record_utils';
import { DataSyncService } from './app.dataSyncService';
import { PatientService } from './modules/patient/patient.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
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
          try {
            const newPatientFromPayload = await this.dataSyncService.syncPatientRecordWithPayload(payloadDto);

            // Create new patient record using PatientService
            const newPatient = await this.patientService.create({
              patientID: newPatientFromPayload.ID,
              data: newPatientFromPayload,
              timestamp: payloadDto.timestamp || Date.now(),
              message: 'Received payload'
            });

            const resultPayload = {
              success: true,
              message: 'Payload created successfully',
              id: newPatient.id,
              patientID: newPatientFromPayload.ID,
              timestamp: new Date().toISOString(),
              updated: false,
              record: newPatientFromPayload,
              hasChanges: true,
              id_to_remove: null,
            };

            results.push(resultPayload);
          } catch (error) {
            this.logger.error(`Failed to sync patient record: ${error.message}`);
            results.push({
              success: false,
              message: 'Failed to create patient record',
              patientID: null,
              timestamp: new Date().toISOString(),
              error: error.message,
            });
          }
          continue;
        }

        // Check if patient record already exists using PatientService
        const existingPatient = await this.patientService.findByPatientId(patientId);

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
              this.logger.error("Existing data was empty or invalid JSON");
            }
          
            // If existing data is empty, use new data directly
            const result = Object.keys(existingData).length === 0 
              ? { mergedData: newData, hasChanges: true }
              : sophisticatedMergePatientData(existingData as any, newData as any) as any;
            
            hasChanges = result.hasChanges;

            // Update existing patient record using PatientService
            const updatedPatient = await this.patientService.updateByPatientId(
              patientId,
              { 
                data: result.mergedData,
                timestamp: payloadDto.timestamp || Date.now(),
                message: 'Updated payload'
              }
            );

            if (!updatedPatient) {
              throw new Error('Failed to update patient record');
            }

            const patient_result = await this.dataSyncService.syncPatientRecord(patientId);
            
            const resultPayload = {
              success: true,
              message: 'Payload updated successfully',
              id: updatedPatient.id,
              patientID: updatedPatient.patientID,
              timestamp: new Date().toISOString(),
              updated: true,
              record: patient_result,
              hasChanges: hasChanges,
              id_to_remove: null,
            };

            try {
              if (patientId.toString() !== patient_result.ID.toString()) {
                await this.patientService.deleteByPatientId(patientId.toString());
                resultPayload.id_to_remove = patientId;
              }
            } catch (error) {
              this.logger.error(`Failed to delete old patient record: ${error.message}`);
            }

            results.push(resultPayload);
          } catch (e) {
            this.logger.error('Error processing existing patient:', e);
            results.push({
              success: false,
              message: 'Error updating existing patient',
              patientID: patientId,
              timestamp: new Date().toISOString(),
              error: e.message,
            });
          }
        } else {
          try {
            // Create new patient record using PatientService
            const newPatient = await this.patientService.create({
              patientID: patientId,
              data: payloadDto as any, // Cast to handle JsonValue type compatibility
              timestamp: payloadDto.timestamp || Date.now(),
              message: 'Received payload'
            });

            const patient_result = await this.dataSyncService.syncPatientRecord(patientId);
            
            const resultPayload = {
              success: true,
              message: 'Payload received and saved successfully',
              id: newPatient.id,
              patientID: patient_result.ID || newPatient.patientID,
              timestamp: new Date().toISOString(),
              updated: false,
              record: patient_result,
              hasChanges: true,
              id_to_remove: null
            };

            try {
              if (patientId.toString() !== patient_result.ID.toString()) {
                await this.patientService.deleteByPatientId(patientId.toString());
                resultPayload.id_to_remove = patientId;
              }
            } catch (error) {
              this.logger.error(`Failed to delete old patient record: ${error.message}`);
            }

            results.push(resultPayload);
          } catch (error) {
            this.logger.error('Error creating new patient:', error);
            results.push({
              success: false,
              message: 'Error creating new patient',
              patientID: patientId,
              timestamp: new Date().toISOString(),
              error: error.message,
            });
          }
        }
      } catch (error) {
        this.logger.error('Error processing payload:', error);
        results.push({
          success: false,
          message: 'Error processing payload',
          patientID: payloadDto.ID || 'unknown',
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
    const patient = await this.patientService.findByPatientId(patientId);
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
    // Implementation depends on your API requirements
    // You can use the patientService to save the record
    try {
      if (record.ID) {
        const existingPatient = await this.patientService.findByPatientId(record.ID);
        if (existingPatient) {
          return await this.patientService.updateByPatientId(record.ID, { data: record });
        } else {
          return await this.patientService.create({
            patientID: record.ID,
            data: record,
            message: 'Saved from API'
          });
        }
      }
      throw new Error('Record must have an ID');
    } catch (error) {
      this.logger.error('Error saving patient record to API:', error);
      throw error;
    }
  }
}