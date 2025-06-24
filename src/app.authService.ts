import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PatientService } from './modules/patient/patient.service';
import { UserService } from './modules/user/user.service';
import { DDEService } from './modules/dde/ddde.service';
import { ServerPatientCountService } from './modules/serverPatientCount/server-patient-count.service';

interface AuthResponse {
  authorization: {
    token: string;
    expiry_time: string;
    user: {
      user_id: number;
      location_id: number;
    };
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
    private readonly configService: ConfigService,
    private readonly patientService: PatientService,
    private readonly userService: UserService,
    private readonly serverPatientCountService: ServerPatientCountService,
    private readonly ddeService: DDEService,
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

        // Create or update user 
        const userData = {
          user_id: data.authorization.user.user_id,
          locationId: data.authorization.user.location_id.toString()
        };

        // Remove existing users and save new user
        await this.userService.deleteAll();
        await this.userService.create(userData);
        
        this.logger.log(`User data saved successfully for user_id: ${userData.user_id}`);
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
async function fetchAndSaveUserData(
  authService: AuthService, 
  userService: UserService, 
  httpService: HttpService, 
  logger: Logger
): Promise<any | null> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      logger.error('Failed to authenticate');
    }
    
    // Get the most recent user
    const users = await userService.findAll();
    const user = users.length > 0 ? users[users.length - 1] : null;

    if (!user) {
      logger.error('No user found in the database');
      return null;
    }

    const userUrl = `${authService.getBaseUrl()}/users/${user.user_id}`;
    
    const { data } = await firstValueFrom(
      httpService.get(userUrl, {
        headers: { Authorization: `${authService.getAuthToken()}` }
      })
    );

    // Update user with new data
    const updatedUser = await userService.updateByUserId(user.user_id, {
      locationId: data.location_id.toString()
    });

    return updatedUser;
  } catch (error) {
    logger.error(`Error fetching/saving user data: ${error.message}`);
    return null;
  }
}

async function updateIfSitePatientCountChanges(
  authService: AuthService, 
  httpService: HttpService, 
  logger: Logger,
  serverPatientCountService: ServerPatientCountService,
  fnToCall: Function
): Promise<boolean> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      logger.error('Failed to authenticate');
    }

    const initialRequest: SyncRequest = {
      previous_sync_date: "",
      page: 1,
      page_size: 1
    };

    const response = await makePatientSyncRequest(initialRequest, authService, httpService, logger);

    if (!response) return false;

    const serverPatientCount = response.server_patient_count;

    // Get all records and ensure only one exists
    const allRecords = await serverPatientCountService.findAll();
    
    let storedPatientCount;
    
    if (allRecords.length === 0) {
      // No records exist, create one
      storedPatientCount = await serverPatientCountService.create({ 
        server_patient_count: 0 
      });
    } else if (allRecords.length === 1) {
      // Only one record exists, use it
      storedPatientCount = allRecords[0];
    } else {
      // Multiple records exist, keep the latest and delete the rest
      logger.warn(`Found ${allRecords.length} patient count records, cleaning up to keep only the latest`);
      
      // Sort by createdAt to get the latest (assuming createdAt exists)
      const sortedRecords = allRecords.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      storedPatientCount = sortedRecords[0]; // Latest record
      const recordsToDelete = sortedRecords.slice(1); // All except the first (latest)
      
      // Delete all old records
      for (const record of recordsToDelete) {
        await serverPatientCountService.remove(record.id as any);
      }
      
      logger.log(`Cleaned up ${recordsToDelete.length} duplicate patient count records`);
    }

    // Check if server count differs from stored count
    if (serverPatientCount !== storedPatientCount.server_patient_count) {
      logger.log(`Patient count changed: ${storedPatientCount.server_patient_count} -> ${serverPatientCount}`);
      
      // Call the passed function
      fnToCall();
      
      // Update the local value
      await serverPatientCountService.update(storedPatientCount.id, {
        server_patient_count: serverPatientCount
      });
      
      logger.log('Local patient count updated successfully');
      return true;
    }

    logger.log('Patient count unchanged');
    return false;

  } catch (error) {
    logger.error('Error in updateIfSitePatientCountChanges:', error);
    return false;
  }
}

/**
 * Synchronize patient IDs from the server
 */
async function syncPatientIds(
  authService: AuthService, 
  httpService: HttpService, 
  logger: Logger, 
  patientService: PatientService, 
  ddeService: DDEService
): Promise<boolean> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      logger.error('Failed to authenticate');
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

    if (!firstResponse) return false;

    // Process first batch of patients
    for (const patient of firstResponse.sync_patients) {
      await updatePayload(patient, patientService, logger, ddeService);
    }

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

      // Process batch of patients
      for (const patient of response.sync_patients) {
        await updatePayload(patient, patientService, logger, ddeService);
      }

      processedPatients += response.sync_patients.length;
      logger.log(`Processed ${processedPatients}/${totalPatients} patients`);
    }

    logger.log('Patient sync completed successfully');
    return true;

  } catch (error) {
    logger.error(`Error syncing patient IDs: ${error.message}`);
    return false;
  }
}

/**
 * Make a single patient sync request
 */
async function makePatientSyncRequest(
  request: SyncRequest, 
  authService: AuthService, 
  httpService: HttpService, 
  logger: Logger
): Promise<SyncPatientsResponse | null> {
  try {
    const isAuthenticated = await authService.ensureAuthenticated();
    if (!isAuthenticated) {
      logger.error("Failed to authenticate")
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
          logger.error(`Sync request failed: ${error.message}`);
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

async function updatePayload(
  patient: any, 
  patientService: PatientService, 
  logger: Logger, 
  ddeService: DDEService
): Promise<void> {
  try {
    if (!patient.ID) {
      throw new Error('Patient ID is required');
    }

    // Remove duplicates first
    await patientService.findAndDeduplicateByDataId(patient.ID.toString());

    // Use updateByPatientId which handles upsert logic
    const result = await patientService.updateByPatientId(
      patient.ID.toString(),
      {
        timestamp: new Date().toISOString(),
        message: 'Updated/Created payload from API VIA ALL',
        data: patient
      }
    );

    // Mark as completed in DDE
    await ddeService.markAsCompleted(patient.ID.toString());
    
    if (result) {
      logger.log(`Updated/Created patient record for patientID: ${patient.ID}`);
    } else {
      logger.warn(`Failed to update/create patient record for patientID: ${patient.ID}`);
    }
  } catch (error) {
    logger.error(`Error updating patient record: ${error.message}`);
    // throw error;
  }
}

// Export the standalone functions for use elsewhere
export { 
  fetchAndSaveUserData, 
  syncPatientIds, 
  makePatientSyncRequest, 
  updatePayload, 
  updateIfSitePatientCountChanges 
};