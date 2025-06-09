import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './modules/user/schema/user.schema';
import { PatientService } from './modules/patient/patient.service';
import { DDEService } from './modules/dde/ddde.service';

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
}

/**
 * Fetch user data and save to database
 */
async function fetchAndSaveUserData(authService: AuthService, userModel: Model<UserDocument>, httpService: HttpService, logger: Logger): Promise<User | null> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      this.logger.error('Failed to authenticate');
      throw new Error('Failed to authenticate');
    }
    
    // Get the most recent user
    const user = await userModel.findOne().sort({ id: -1 });

    if (!user) {
      logger.error('No user found in the database');
      return null;
    }

    const userUrl = `${authService.getBaseUrl()}/users/${user.id}`;
    
    const { data } = await firstValueFrom(
      httpService.get(userUrl, {
        headers: { Authorization: `${authService.getAuthToken()}` }
      })
    );

    // Update user with new data
    const updatedUser = await userModel.findOneAndUpdate(
      { id: user.id },
      { locationId: data.location_id },
      { new: true }
    );

    return updatedUser;
  } catch (error) {
    logger.error(`Error fetching/saving user data: ${error.message}`);
    return null;
  }
}

/**
 * Synchronize patient IDs from the server
 */
async function syncPatientIds(authService: AuthService, httpService: HttpService, logger: Logger, patientService: PatientService, ddeService: DDEService): Promise<boolean> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      this.logger.error('Failed to authenticate');
      throw new Error('Failed to authenticate');
    }

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
    const firstResponse = await makePatientSyncRequest(initialRequest, authService, httpService, logger);

      // console.log('First response:', firstResponse.sync_patients);
      firstResponse.sync_patients.forEach((patient) => {
          updatePayload(patient, patientService, logger, ddeService);
      })

    if (!firstResponse) return false;

    totalPatients = firstResponse.server_patient_count;
    processedPatients += firstResponse.sync_patients.length;
    
    logger.log(`Total patients to sync: ${totalPatients}`);
    logger.log(`Processed ${processedPatients} patients`);

    // Continue fetching if there are more patients
    while (processedPatients < totalPatients) {
      currentPage++;
      
      const request: SyncRequest = {
        previous_sync_date: "",
        page: currentPage,
        page_size: PAGE_SIZE
      };

      const response = await makePatientSyncRequest(request, authService, httpService, logger);
      if (!response) return false;

      // console.log('First response:', firstResponse.sync_patients);
      response.sync_patients.forEach((patient) => {
          updatePayload(patient, patientService, logger, ddeService);
      })

      processedPatients += response.sync_patients.length;
      logger.log(`Processed ${processedPatients}/${totalPatients} patients`);
    }

    logger.log('Patient sync completed successfully');
    return true;

  } catch (error) {
    // logger.error(`Error syncing patient IDs: ${error.message}`);
    return false;
  }
}

/**
 * Make a single patient sync request
 */
async function makePatientSyncRequest(request: SyncRequest, authService: AuthService, httpService: HttpService, logger: Logger): Promise<SyncPatientsResponse | null> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Failed to authenticate');
    }
    const syncUrl = `${authService.getBaseUrl()}/sync/patients_ids`;
    
    const { data } = await firstValueFrom(
      httpService.post<SyncPatientsResponse>(
        syncUrl,
        request,
        {
          headers: { Authorization: `${authService.getAuthToken()}` }
        }
      ).pipe(
        catchError((error: AxiosError) => {
          logger.error(`Sync request failed: ${error}`);
          throw error;
        }),
      ),
    );

    return data;
  } catch (error) {
    logger.error(`Error making sync request: ${error.message}`);
    return null;
  }
}

async function updatePayload(patient: any, patientService: PatientService, logger: Logger, ddeService: DDEService): Promise<void> {
    try {
      if (!patient.ID) {
        throw new Error('Patient ID is required');
      }

      patientService.findAndDeduplicateByDataId(patient.ID.toString());

      // Use upsert to update if exists, create if doesn't exist
      const result = await patientService.upsert(
        { patientID: patient.ID.toString() }, // Find by patientID
        {
          $set: {
            timestamp: Date.now(),
            message: 'Updated/Created payload from API VIA ALL',
            data: patient
          },
          $setOnInsert: {
            patientID: patient.ID.toString() // Only set on insert
          }
        }
      );

      ddeService.markAsCompleted(patient.ID.toString());
      
      if (result.upsertedCount > 0) {
        logger.log(`Created new patient record for patientID: ${patient.ID}`);
      } else {
        logger.log(`Updated existing patient record with patientID: ${patient.ID}`);
      }
    } catch (error) {
      logger.error(`Error updating patient record: ${error.message}`);
      throw error;
    }
  }

// Export the standalone functions for use elsewhere
export { fetchAndSaveUserData, syncPatientIds, makePatientSyncRequest, updatePayload };