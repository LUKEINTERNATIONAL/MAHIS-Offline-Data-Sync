import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Payload } from './payload.entity';
import { sophisticatedMergePatientData } from './utils/patient_record_utils';
import { AuthService } from './app.authService';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private authService: AuthService,
    @InjectRepository(Payload)
    private payloadRepository: Repository<Payload>,
  ) {}

  /**
   * Sync all patient records from the local database to the external API
   */
  async syncPatientRecords() {
    try {
      // Ensure we have a valid token
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }

      // Get all records from database
      this.logger.log('Fetching all patient records from database');
      const allRecords = await this.payloadRepository.find();
      
      if (!allRecords || allRecords.length === 0) {
        this.logger.log('No records found in database to sync');
        return { success: true, message: 'No records to sync', count: 0 };
      }

      this.logger.log(`Found ${allRecords.length} records to sync`);
      
      // The endpoint for saving patient records
      const saveUrl = `${this.authService.getBaseUrl()}/api/v1/save_patient_record`;
      
      // Track sync results
      const results = {
        total: allRecords.length,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };

      // Process each record
      for (const record of allRecords) {
        try {
          // Parse the data field from string to JSON
          let parsedData = {};
          try {
            if (record.data) {
              parsedData = JSON.parse(record.data);
            }
          } catch (parseError) {
            this.logger.warn(`Failed to parse data for record ID ${record.id}: ${parseError.message}`);
            // If we can't parse the data, use an empty object
            parsedData = {};
          }

          // Prepare the payload to send - spreading the parsed data into the record
          const syncPayload = {
            record: {
              ...parsedData,
              timestamp: record.timestamp,
            }
          } as any;

          // Send the data to the external API
          const { data: responseData } = await firstValueFrom(
            this.httpService.post(saveUrl, syncPayload, {
              headers: {
                Authorization: this.authService.getAuthToken(),
                'Content-Type': 'application/json',
              },
            }).pipe(
              catchError((error: AxiosError) => {
                this.logger.error(`Failed to sync record ID ${record.id}: ${error.message}`);
                if (error.response) {
                  this.logger.error(`Response status: ${error.response.status}`);
                  this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                }
                
                // Add to failure count but continue with other records
                results.failed++;
                results.errors.push({
                  recordId: record.id,
                  patientID: record.patientID,
                  error: error.message,
                });
                
                throw new Error(`API sync failed: ${error.message}`);
              }),
            ),
          );

          // Update the local record with the API response
          let responseString = JSON.stringify(responseData);
          if (responseData) {
            console.log(responseData)
            // Merge patient data if patient IDs match
            if (syncPayload.record && syncPayload.record.patientID == responseData.patientID) {
              // const result = sophisticatedMergePatientData(syncPayload.record as any, responseData as any) as any;
              responseString = JSON.stringify(responseData);
            }
            
            // Update the local database record
            await this.payloadRepository.update(
              { id: record.id },
              { 
                data: responseString,
                message: 'Updated from API response'
              }
            );
            
            this.logger.log(`Successfully synced and updated record ID ${record.id} for patient ${record.patientID}`);
            results.successful++;
            results.updatedRecords.push(record.id);
          }

        } catch (syncError) {
          this.logger.error(`Error processing record ID ${record.id}: ${syncError.message}`);
          results.failed++;
          results.errors.push({
            recordId: record.id,
            patientID: record.patientID,
            error: syncError.message,
          });
        }
      }

      this.logger.log(`Sync completed. Successfully synced and updated ${results.successful}/${results.total} records`);
      return {
        success: true,
        message: `Synced ${results.successful} of ${results.total} records`,
        ...results,
      };
    } catch (error) {
      this.logger.error(`Patient record sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize the service - typically called at application startup
   */
  async initialize(): Promise<void> {
    try {
      await this.authService.initialize();
      this.logger.log('DataSyncService initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize DataSyncService: ${error.message}`);
    }
  }
}