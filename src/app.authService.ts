import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Payload } from './payload.entity';
import { sophisticatedMergePatientData } from './utils/patient_record_utils'

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payload)
    private readonly payloadRepository: Repository<Payload>,
  ) {
    this.baseUrl = this.configService.get<string>('API_BASE_URL');
  }

  /**
   * Login to the API and get authentication token
   */
  async login(): Promise<boolean> {
    try {
      const loginUrl = `${this.baseUrl}/api/v1/auth/login`;
      const loginData = {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      };

      this.logger.log(`Attempting to login to ${loginUrl}`);

      const { data } = await firstValueFrom(
        this.httpService.post<AuthResponse>(loginUrl, loginData)
//TODO: uncomment the catchError block when you want to handle errors

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

        // Create or update user entity
        const user = new User();
        user.id = data.authorization.user.user_id;
        user.locationId = data.authorization.user.location_id;

        // Get all existing users
        const existingUsers = await this.userRepository.find();

        // If there are any records, remove them
        if (existingUsers.length > 0) {
            await this.userRepository.remove(existingUsers);
        }

        // Save the new user record
        const savedUser = await this.userRepository.save(user);
        
        this.logger.log(`User data saved successfully for ID: ${savedUser.id}`);
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
      
      // Get the user from repository with proper selection criteria
      const user = await this.userRepository.findOne({
        where: {},  // Empty where clause to get any user
        order: { id: 'DESC' }
      });

      if (!user) {
        this.logger.error('No user found in the repository');
        return null;
      }

      const userUrl = `${this.baseUrl}/api/v1/users/${user.id}`;
      
      const { data } = await firstValueFrom(
        this.httpService.get<UserResponse>(userUrl, {
          headers: { Authorization: `${this.authToken}` }
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Failed to fetch user data: ${error.message}`);
            throw error;
          }),
        ),
      ) as any;

    //   console.log('User data fetched successfully:', data);

      // Update the user with new data
    //   user.locationId = data.location_id;
    //   return await this.userRepository.save(user);

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
      const syncUrl = `${this.baseUrl}/api/v1/sync/patients_ids`;
      
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
        // Find existing payload for this patient
        const existingPayload = await this.payloadRepository.findOne({
            where: { patientID: patient.patientID?.toString() }
        });

        if (existingPayload) {
            if (existingPayload.patientID == patient.patientID) {
                // this.logger.log(`Found existing payload for patient ID: ${patient.patientID}`);
                // const result = sophisticatedMergePatientData(JSON.parse(existingPayload.data) as any, patient as any) as any;
                // existingPayload.data = JSON.stringify(result.mergedData);
                existingPayload.timestamp = Date.now();
                existingPayload.message = 'Updated payload from API VIA ALL';
                existingPayload.data = JSON.stringify(patient);
                await this.payloadRepository.save(existingPayload);
            }
        } else {
            this.logger.log(`Creating new payload for patient ID: ${patient.patientID}`);
            const newPayload = new Payload();
            newPayload.patientID = patient.patientID.toString();
            newPayload.message = 'Created payload from API';
            newPayload.timestamp = Date.now();
            newPayload.data = JSON.stringify(patient);
            await this.payloadRepository.save(newPayload);
        }
    } catch (error) {
        this.logger.error(`Error updating payload: ${error.message}`);
        throw error;
    }
  }
}