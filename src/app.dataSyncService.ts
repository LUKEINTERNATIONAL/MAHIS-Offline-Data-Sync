import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Payload } from './payload.entity';

interface AuthResponse {
  authorization: {
    token: string;
    expiry_time: string;
  };
}

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);
  private baseUrl: string;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    @InjectRepository(Payload)
    private payloadRepository: Repository<Payload>,
  ) {
    // Get API base URL from environment variables or use default
    this.baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
  }

  /**
   * Login to the API and get authentication token
   */
  async login(): Promise<boolean> {
    try {
      const loginUrl = `${this.baseUrl}/api/v1/auth/login`;
      const loginData = {
        username: 'ras',
        password: 'Ras@2025',
      };

      this.logger.log(`Attempting to login to ${loginUrl}`);

      const { data } = await firstValueFrom(
        this.httpService.post<AuthResponse>(loginUrl, loginData).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Login failed: ${error.message}`);
            if (error.response) {
              this.logger.error(`Response status: ${error.response.status}`);
              this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Authentication failed: ${error.message}`);
          }),
        ),
      );

      if (data && data.authorization && data.authorization.token) {
        this.authToken = data.authorization.token;
        this.tokenExpiry = new Date(data.authorization.expiry_time);
        this.logger.log(`Login successful. Token valid until: ${this.tokenExpiry}`);
        return true;
      } else {
        this.logger.error('Login response did not contain expected token data');
        return false;
      }
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check if the current token is valid
   */
  private isTokenValid(): boolean {
    if (!this.authToken || !this.tokenExpiry) {
      return false;
    }

    const now = new Date();
    // Add 5 min buffer to ensure token doesn't expire during operation
    const bufferTime = 5 * 60 * 1000; 
    return this.tokenExpiry.getTime() > now.getTime() + bufferTime;
  }

  /**
   * Ensures authentication before making API calls
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true;
    }
    
    this.logger.log('Authentication token missing or expired. Logging in again...');
    return await this.login();
  }

  /**
   * Sync all patient records from the local database to the external API
   */
  async syncPatientRecords() {
    try {
      // Ensure we have a valid token
      const isAuthenticated = await this.ensureAuthenticated();
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
      const saveUrl = `${this.baseUrl}/api/v1/save_patient_record`;
      
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
          };

          // Send the data to the external API
          const { data: responseData } = await firstValueFrom(
            this.httpService.post(saveUrl, syncPayload, {
              headers: {
                Authorization: this.authToken,
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
                
                // Return null to continue the loop
                throw new Error(`API sync failed: ${error.message}`);
              }),
            ),
          );

          // Update the local record with the API response
          if (responseData) {
            // Convert the response data to string for storage
            const responseString = JSON.stringify(responseData);
            
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
      const loggedIn = await this.login();
      if (loggedIn) {
        this.logger.log('DataSyncService initialized successfully');
      } else {
        this.logger.warn('DataSyncService initialized with failed authentication');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize DataSyncService: ${error.message}`);
    }
  }
}