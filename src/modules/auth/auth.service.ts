import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';


interface AuthResponse {
  authorization: {
    token: string;
    expiry_time: string;
  };
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
      ) as any;

      if (data && data.authorization && data.authorization.token) {
        this.authToken = data.authorization.token;
        this.tokenExpiry = new Date(data.authorization.expiry_time);

        // Create or update user 
        const userData = {
          id: data.authorization.user.user_id,
          locationId: data.authorization.user.location_id.toString()
        };
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
        this.logger.log('=======> AuthService initialized successfully<==========');
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