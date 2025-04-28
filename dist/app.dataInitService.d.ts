import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Payload } from './payload.entity';
import { AuthService } from './app.authService';
export declare class DataInitService {
    private readonly httpService;
    private authService;
    private payloadRepository;
    private readonly logger;
    constructor(httpService: HttpService, authService: AuthService, payloadRepository: Repository<Payload>);
}
