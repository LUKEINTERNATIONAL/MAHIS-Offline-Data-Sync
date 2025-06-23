import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PatientService } from './modules/patient/patient.service';
import { AuthService } from './app.authService';
import { lastValueFrom } from 'rxjs';
import { SyncGateway } from './websocket/gateways/sync.gateway';
import { DDEService } from './modules/dde/ddde.service';
import { Patient } from '@prisma/client';

interface SyncResult {
  success: boolean;
  message: string;
  total?: number;
  successful?: number;
  failed?: number;
  errors?: Array<{
    recordId: string;
    patientID: string;
    error: string;
  }>;
  updatedRecords?: string[];
  count?: number;
}

interface SyncStatus {
  totalRecords: number;
  lastSyncedRecords: number;
  pendingSync: number;
}

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
  async syncPatientRecords(): Promise<SyncResult> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        this.logger.error("Failed to authenticate")
      }

      this.logger.log('Fetching all patient records from database');
      const allRecords = await this.patientService.findAll();
      
      if (!allRecords || allRecords.length === 0) {
        this.logger.log('No records found in database to sync');
        return { success: true, message: 'No records to sync', count: 0 };
      }

      this.logger.log(`Found ${allRecords.length} records to sync`);
      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;
      
      const results: SyncResult = {
        success: true,
        message: '',
        total: allRecords.length,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };

      for (const record of allRecords) {
        try {
          const syncResult = await this.syncSingleRecord(record, saveUrl);
          if (syncResult.success) {
            results.successful++;
            results.updatedRecords.push(record.id);
          } else {
            results.failed++;
            results.errors.push({
              recordId: record.id,
              patientID: record.patientID,
              error: syncResult.error || 'Unknown error',
            });
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

      results.message = `Synced ${results.successful} of ${results.total} records`;
      this.logger.log(`Sync completed. Successfully synced and updated ${results.successful}/${results.total} records`);
      
      return results;
    } catch (error) {
      this.logger.error(`Patient record sync failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };
    }
  }

  /**
   * Sync specific patient record by patientID
   */
  async syncPatientRecord(patientID: string): Promise<any> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        this.logger.error("Failed to authenticate")
      }

      this.logger.log(`Syncing specific patient record: ${patientID}`);
      const record = await this.patientService.findByPatientId(patientID);
      
      if (!record) {
        this.logger.warn(`Patient record not found: ${patientID}`);
        return { success: false, message: 'Patient record not found' };
      }

      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;
      const syncResult = await this.syncSingleRecord(record, saveUrl);
      
      if (syncResult.success && syncResult.responseData) {
        // Update the patient record with the API response
        const updatedPatient = await this.patientService.updateByPatientId(patientID, {
          data: syncResult.responseData,
          message: 'Updated from API response',
          timestamp:  new Date().toISOString() as any,
        });

        this.syncGateway.broadcastPatientUpdate(patientID, syncResult.responseData);
        this.ddeService.markAsCompleted(syncResult.responseData.ID || patientID);

        this.logger.log(`Successfully synced patient record: ${patientID}`);
        return syncResult.responseData;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to sync patient record ${patientID}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync patient record with custom payload
   */
  async syncPatientRecordWithPayload(syncPayload: any, isNew: boolean = false): Promise<any> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        this.logger.error("Failed to authenticate")
      }

      if (!syncPayload) {
        throw new Error('Sync payload is required');
      }

      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;

      if (isNew == false) {
        syncPayload = {
          record: {
            ...syncPayload
          }
        };
      }
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(saveUrl, syncPayload, {
          headers: {
            Authorization: this.authService.getAuthToken(),
            'Content-Type': 'application/json',
          },
        })
      );

      this.logger.log('Sync from API response received:');
      return responseData;
    } catch (error) {
      this.logger.error(`Failed to sync patient record with payload: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get sync status for all patients
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const allRecords = await this.patientService.findAll();
      
      const lastSyncedRecords = allRecords.filter(record => 
        record.message && record.message.includes('Updated from API response')
      ).length;

      const pendingSync = allRecords.length - lastSyncedRecords;

      return {
        totalRecords: allRecords.length,
        lastSyncedRecords,
        pendingSync,
      };
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
      // throw error;
    }
  }

  /**
   * Helper method to sync a single record
   */
  private async syncSingleRecord(record: Patient, saveUrl: string): Promise<{
    success: boolean;
    error?: string;
    responseData?: any;
  }> {
    try {
      // Safely extract data from the record
      let parsedData: any = {};
      if (record.data) {
        if (typeof record.data === 'string') {
          try {
            parsedData = JSON.parse(record.data);
          } catch (parseError) {
            this.logger.warn(`Failed to parse data for record ID ${record.id}: ${parseError.message}`);
            parsedData = {};
          }
        } else {
          parsedData = record.data;
        }
      }

      const syncPayload = {
        record: {
          ...parsedData
        }
      };
      
      const { data: responseData } = await lastValueFrom(
        this.httpService.post(saveUrl, syncPayload, {
          headers: {
            Authorization: this.authService.getAuthToken(),
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        })
      );

      if (responseData) {
        // Update the local record with the response
        const patientId = parsedData.ID || record.patientID;
        await this.patientService.updateByPatientId(patientId, {
          data: responseData,
          message: 'Updated from API response',
          timestamp: new Date().toISOString() as any,
        });

        this.ddeService.markAsCompleted(patientId);
        this.syncGateway.broadcastPatientUpdate(patientId, responseData);

        return { success: true, responseData };
      }

      return { success: false, error: 'No response data received' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch sync with concurrency control
   */
  async syncPatientRecordsBatch(batchSize: number = 5): Promise<SyncResult> {
    try {
      const isAuthenticated = await this.authService.ensureAuthenticated();
      if (!isAuthenticated) {
        this.logger.error("Failed to authenticate")
      }

      this.logger.log('Fetching all patient records from database');
      const allRecords = await this.patientService.findAll();
      
      if (!allRecords || allRecords.length === 0) {
        this.logger.log('No records found in database to sync');
        return { success: true, message: 'No records to sync', count: 0 };
      }

      this.logger.log(`Found ${allRecords.length} records to sync in batches of ${batchSize}`);
      const saveUrl = `${this.authService.getBaseUrl()}/save_patient_record`;
      
      const results: SyncResult = {
        success: true,
        message: '',
        total: allRecords.length,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };

      // Process records in batches
      for (let i = 0; i < allRecords.length; i += batchSize) {
        const batch = allRecords.slice(i, i + batchSize);
        this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allRecords.length / batchSize)}`);

        const batchPromises = batch.map(async (record) => {
          try {
            const syncResult = await this.syncSingleRecord(record, saveUrl);
            return { record, syncResult };
          } catch (error) {
            return { record, syncResult: { success: false, error: error.message } };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { record, syncResult } = result.value;
            if (syncResult.success) {
              results.successful++;
              results.updatedRecords.push(record.id);
            } else {
              results.failed++;
              results.errors.push({
                recordId: record.id,
                patientID: record.patientID,
                error: syncResult.error || 'Unknown error',
              });
            }
          } else {
            results.failed++;
            results.errors.push({
              recordId: 'unknown',
              patientID: 'unknown',
              error: result.reason?.message || 'Promise rejected',
            });
          }
        });

        // Small delay between batches to avoid overwhelming the API
        if (i + batchSize < allRecords.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      results.message = `Synced ${results.successful} of ${results.total} records`;
      this.logger.log(`Batch sync completed. Successfully synced ${results.successful}/${results.total} records`);
      
      return results;
    } catch (error) {
      this.logger.error(`Batch patient record sync failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [],
        updatedRecords: [],
      };
    }
  }
}