import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Payload } from './payload.entity';
import { AuthService } from './app.authService';
export declare class DataSyncService {
    private readonly httpService;
    private authService;
    private payloadRepository;
    private readonly logger;
    constructor(httpService: HttpService, authService: AuthService, payloadRepository: Repository<Payload>);
    syncPatientRecords(): Promise<{
        success: boolean;
        message: string;
        count: number;
    } | {
        total: number;
        successful: number;
        failed: number;
        errors: any[];
        updatedRecords: any[];
        success: boolean;
        message: string;
        count?: undefined;
    }>;
    initialize(): Promise<void>;
}
