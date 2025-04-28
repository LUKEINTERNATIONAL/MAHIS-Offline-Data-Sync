import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSyncService } from './../app.dataSyncService';
import { AuthService } from './../app.authService';
export declare class DataSyncScheduler implements OnModuleInit {
    private readonly dataSyncService;
    private configService;
    private authService;
    private readonly logger;
    private isEnabled;
    constructor(dataSyncService: DataSyncService, configService: ConfigService, authService: AuthService);
    onModuleInit(): Promise<void>;
    scheduledSync(): Promise<void>;
    private syncPatientRecords;
    triggerManualSync(): Promise<any>;
}
