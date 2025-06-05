import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './modules/patient/schema/patient.schema';
import { User, UserDocument } from './modules/user/schema/user.schema';
import { sophisticatedMergePatientData } from './utils/patient_record_utils';
import { PatientService } from './modules/patient/patient.service';

interface AuthResponse {
  authorization: {
    token: string;
    expiry_time: string;
  };
}

interface UserResponse {
  id: number;
  location_id: number;
  // ... other fields from API that we don't need to store
}

interface SyncPatientsResponse {
  sync_patients: any[];
  sync_count: number;
  latest_encounter_datetime: string;
  server_patient_count: number;
}

interface SyncRequest {
  previous_sync_date: string;
  page: number;
  page_size: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private baseUrl: string;
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private readonly patientService: PatientService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    this.baseUrl = this.configService.get<string>('API_BASE_URL');
  }

  /**
   * Login to the API and get authentication token
   */
  async login(): Promise<boolean> {
    try {
      const loginUrl = `${this.baseUrl}/auth/login`;
      const loginData = {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      };

      this.logger.log(`Attempting to login to ${loginUrl}`);

      const { data } = await firstValueFrom(
        this.httpService.post<AuthResponse>(loginUrl, loginData)
        
        // .pipe(
        //   catchError((error: AxiosError) => {
        //     this.logger.error(`Login failed: ${error.message}`);
        //     if (error.response) {
        //       this.logger.error(`Response status: ${error.response.status}`);
        //       this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        //     }
        //     throw new Error(`Authentication failed: ${error.message}`);
        //   }),
        // ),
      ) as any;

      if (data && data.authorization && data.authorization.token) {
        this.authToken = data.authorization.token;
        this.tokenExpiry = new Date(data.authorization.expiry_time);

        // Create or update user 
        const userData = {
          id: data.authorization.user.user_id,
          locationId: data.authorization.user.location_id.toString()
        };

        // Remove existing users
        await this.userModel.deleteMany({});

        // Save new user
        await this.userModel.create(userData);
        
        this.logger.log(`User data saved successfully for ID: ${userData.id}`);
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
  isTokenValid(): boolean {
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
  async ensureAuthenticated(): Promise<boolean> {
    if (this.isTokenValid()) {
      return true;
    }
    
    this.logger.log('Authentication token missing or expired. Logging in again...');
    return await this.login();
  }

  /**
   * Get the current auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Get the base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Initialize the service - typically called at application startup
   */
  async initialize(): Promise<boolean> {
    try {
      const loggedIn = await this.login();
      if (loggedIn) {
        this.logger.log('AuthService initialized successfully');
      } else {
        this.logger.warn('AuthService initialized with failed authentication');
      }
      return loggedIn;
    } catch (error) {
      this.logger.error(`Failed to initialize AuthService: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch user data and save to database
   */
  async fetchAndSaveUserData(): Promise<User | null> {
    try {
      await this.ensureAuthenticated();
      
      // Get the most recent user
      const user = await this.userModel.findOne().sort({ id: -1 });

      if (!user) {
        this.logger.error('No user found in the database');
        return null;
      }

      const userUrl = `${this.baseUrl}/users/${user.id}`;
      
      const { data } = await firstValueFrom(
        this.httpService.get(userUrl, {
          headers: { Authorization: `${this.authToken}` }
        })
      );

      // Update user with new data
      const updatedUser = await this.userModel.findOneAndUpdate(
        { id: user.id },
        { locationId: data.location_id },
        { new: true }
      );

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error fetching/saving user data: ${error.message}`);
      return null;
    }
  }

  /**
   * Synchronize patient IDs from the server
   */
  async syncPatientIds(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();

      const PAGE_SIZE = 50;
      let currentPage = 1;
      let totalPatients = 0;
      let processedPatients = 0;
      
      // Initial sync request
      const initialRequest: SyncRequest = {
        previous_sync_date: "",
        page: currentPage,
        page_size: PAGE_SIZE
      };

      // Make the first request to get total count
      const firstResponse = await this.makePatientSyncRequest(initialRequest);

        // console.log('First response:', firstResponse.sync_patients);
        firstResponse.sync_patients.forEach((patient) => {
            // console.log('Patient:', patient.patientID);
            this.updatePayload(patient);
        })

      if (!firstResponse) return false;

      totalPatients = firstResponse.server_patient_count;
      processedPatients += firstResponse.sync_patients.length;
      
      this.logger.log(`Total patients to sync: ${totalPatients}`);
      this.logger.log(`Processed ${processedPatients} patients`);

      // Continue fetching if there are more patients
      while (processedPatients < totalPatients) {
        currentPage++;
        
        const request: SyncRequest = {
          previous_sync_date: "",
          page: currentPage,
          page_size: PAGE_SIZE
        };

        const response = await this.makePatientSyncRequest(request);
        if (!response) return false;

        // console.log('First response:', firstResponse.sync_patients);
        response.sync_patients.forEach((patient) => {
            // console.log('Patient:', patient.patientID);
            this.updatePayload(patient);
        })

        processedPatients += response.sync_patients.length;
        this.logger.log(`Processed ${processedPatients}/${totalPatients} patients`);
      }

      this.logger.log('Patient sync completed successfully');
      return true;

    } catch (error) {
      this.logger.error(`Error syncing patient IDs: ${error.message}`);
      return false;
    }
  }

  /**
   * Make a single patient sync request
   */
  private async makePatientSyncRequest(request: SyncRequest): Promise<SyncPatientsResponse | null> {
    try {
      const syncUrl = `${this.baseUrl}/sync/patients_ids`;
      
      const { data } = await firstValueFrom(
        this.httpService.post<SyncPatientsResponse>(
          syncUrl,
          request,
          {
            headers: { Authorization: `${this.authToken}` }
          }
        ).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Sync request failed: ${error.message}`);
            throw error;
          }),
        ),
      );

      return data;
    } catch (error) {
      this.logger.error(`Error making sync request: ${error.message}`);
      return null;
    }
  }

  private async updatePayload(patient: any): Promise<void> {
      try {
        if (!patient.patientID) {
          throw new Error('Patient ID is required');
        }

        // Use upsert to update if exists, create if doesn't exist
        const result = await this.patientService.upsert(
          { patientID: patient.patientID.toString() }, // Find by patientID
          {
            $set: {
              timestamp: Date.now(),
              message: 'Updated/Created payload from API VIA ALL',
              data: JSON.stringify(patient)
            },
            $setOnInsert: {
              patientID: patient.patientID.toString() // Only set on insert
            }
          }
        );
        
        if (result.upsertedCount > 0) {
          this.logger.log(`Created new patient record for patientID: ${patient.patientID}`);
        } else {
          this.logger.log(`Updated existing patient record with patientID: ${patient.patientID}`);
        }
      } catch (error) {
        this.logger.error(`Error updating patient record: ${error.message}`);
        throw error;
      }
    }
}