import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Payload } from './payload.entity';
export declare class AuthService {
    private readonly httpService;
    private configService;
    private readonly userRepository;
    private readonly payloadRepository;
    private readonly logger;
    private baseUrl;
    private authToken;
    private tokenExpiry;
    constructor(httpService: HttpService, configService: ConfigService, userRepository: Repository<User>, payloadRepository: Repository<Payload>);
    login(): Promise<boolean>;
    isTokenValid(): boolean;
    ensureAuthenticated(): Promise<boolean>;
    getAuthToken(): string | null;
    getBaseUrl(): string;
    initialize(): Promise<boolean>;
    fetchAndSaveUserData(): Promise<User | null>;
    syncPatientIds(): Promise<boolean>;
    private makePatientSyncRequest;
    private updatePayload;
}
