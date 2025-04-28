import { Repository } from 'typeorm';
import { PayloadDto } from './app.controller';
import { Payload } from './payload.entity';
export declare class AppService {
    private readonly payloadRepository;
    constructor(payloadRepository: Repository<Payload>);
    getHome(): Promise<string>;
    processPayload(payloadDto: PayloadDto): Promise<{
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
    getPatientPayload(patientId: string): Promise<Payload>;
}
