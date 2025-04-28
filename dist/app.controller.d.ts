import { AppService } from './app.service';
export declare class PayloadDto {
    readonly message: string;
    readonly data?: any;
    readonly timestamp?: number;
    readonly patientID?: string;
}
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHome(): Promise<string>;
    receivePayload(payload: PayloadDto): Promise<{
        success: boolean;
        message: string;
        id: number;
        patientID: string;
        timestamp: string;
        updated: boolean;
        record: string;
        hasChanges: boolean;
    } | {
        success: boolean;
        message: string;
        id: number;
        patientID: string;
        timestamp: string;
        updated: boolean;
        hasChanges: boolean;
        record?: undefined;
    }>;
    getAllPatientIds(): Promise<string[]>;
    getPatientPayload(patientId: string): Promise<any>;
}
