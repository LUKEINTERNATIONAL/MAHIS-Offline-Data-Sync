import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Payload } from './payload.entity';
import { sophisticatedMergePatientData } from './utils/patient_record_utils';
import { AuthService } from './app.authService';

@Injectable()
export class DataInitService {
    private readonly logger = new Logger(DataInitService.name);

    constructor(
      private readonly httpService: HttpService,
      private authService: AuthService,
      @InjectRepository(Payload)
      private payloadRepository: Repository<Payload>,
    ) {}

    


}