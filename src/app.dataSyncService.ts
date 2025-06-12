import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PatientService } from './modules/patient/patient.service';
import { AuthService } from './app.authService';
import { lastValueFrom } from 'rxjs';
import { SyncGateway } from './websocket/gateways/sync.gateway';
import { DDEService } from './modules/dde/ddde.service';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
    private readonly patientService: PatientService,
    private readonly syncGateway: SyncGateway,
    private readonly ddeService: DDEService,
  ) {}

  /**
   * Sync all patient records from the local database to the external API
   */
  async syncPatientRecords() {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }

      this.logger.log('Fetching all patient records from database');
      const allRecords = await this.patientService.findAll();
      
      if (!allRecords || allRecords.length === 0) {
        this.logger.log('No records found in database to sync');
        return { success: true, message: 'No records to sync', count: 0 };
      }

      this.logger.log(`Found ${allRecords.length} records to sync`);
      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;
      
      const results = {
        total: allRecords.length,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };

      for (const record of allRecords) {
        try {
          let parsedData: any = {};
          try {
            if (record.data) {
              parsedData = record.data;
            }
          } catch (parseError) {
            this.logger.warn(`Failed to parse data for record ID ${record._id.toString()}: ${parseError.message}`);
          }

          const syncPayload = {
            record: {
              ...parsedData,
              patientID: parsedData.ID, // Explicitly include patientID
              timestamp: record.timestamp,
            }
          };

          const { data: responseData } = await lastValueFrom(
            this.httpService.post(saveUrl, syncPayload, {
              headers: {
                Authorization: this.authService.getAuthToken(),
                'Content-Type': 'application/json',
              },
            })
          );

          if (responseData) {
            // Update using PatientService by MongoDB _id
            await this.patientService.updateByPatientId(parsedData.ID, parsedData);
            this.ddeService.markAsCompleted(parsedData.ID);
            this.syncGateway.broadcastPatientUpdate(record.patientID, parsedData);
            
            results.successful++;
            results.updatedRecords.push(record._id);
          }

        } catch (syncError) {
          // this.logger.error(`Error processing record ID ${record._id.toString()}: ${syncError.message}`);
          results.failed++;
          results.errors.push({
            recordId: record._id.toString(),
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
      // throw error;
    }
  }

  /**
   * Sync specific patient record by patientID
   */
  async syncPatientRecord(patientID: string) {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }

      this.logger.log(`Syncing specific patient record: ${patientID}`);
      const record = await this.patientService.findByPatientId(patientID);
      
      if (!record) {
        this.logger.warn(`Patient record not found: ${patientID}`);
        return { success: false, message: 'Patient record not found' };
      }

      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;
      
      let parsedData: any = {};
      try {
        if (record.data) {
          parsedData = record.data;
        }
      } catch (parseError) {
        this.logger.warn(`Failed to parse data for patientID ${patientID}: ${parseError.message}`);
      }

      const syncPayload = {
        record: {
          ...parsedData,
          timestamp: record.timestamp,
        }
      };

      const { data: responseData } = await lastValueFrom(
        this.httpService.post(saveUrl, syncPayload, {
          headers: {
            Authorization: this.authService.getAuthToken(),
            'Content-Type': 'application/json',
          },
        })
      );

      if (responseData) {
        // Update using PatientService by patientID
        const updatedPatient = await this.patientService.updateByPatientId(responseData.ID, {
          data: responseData,
          message: 'Updated from API response',
          timestamp: Date.now(),
        });

        this.syncGateway.broadcastPatientUpdate(patientID, responseData);
        this.ddeService.markAsCompleted(responseData.ID);

        this.logger.log('New Patiend ID: ', responseData.ID);
        this.logger.log(`Successfully synced patient record: ${patientID}`);

        return responseData
      }

      return null;

    } catch (error) {
      this.logger.error(`Failed to sync patient record ${patientID}: ${error.message}`);
      // throw error;
    }
  }

  async syncPatientRecordWithPayload(syncPayload: any) {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate');
      }

      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;

      this.logger.log("syncPayload :", syncPayload);

      const { data: responseData } = await lastValueFrom(
        this.httpService.post(saveUrl, syncPayload, {
          headers: {
            Authorization: this.authService.getAuthToken(),
            'Content-Type': 'application/json',
          },
        })
      );

      return responseData;

    } catch (error) {
      this.logger.error(`Failed to sync patient record: ${error.message}`);
      // throw error;
    }
    }

  /**
   * Get sync status for all patients
   */
  async getSyncStatus() {
    try {
      const allRecords = await this.patientService.findAll();
      
      const status = {
        totalRecords: allRecords.length,
        lastSyncedRecords: allRecords.filter(record => 
          record.message && record.message.includes('Updated from API response')
        ).length,
        pendingSync: allRecords.filter(record => 
          !record.message || !record.message.includes('Updated from API response')
        ).length,
      };

      return status;
    } catch (error) {
      this.logger.error(`Failed to get sync status: ${error.message}`);
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