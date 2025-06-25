import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class LiveAPIService implements OnModuleInit {
    private readonly logger = new Logger(LiveAPIService.name);
    private baseUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.baseUrl = this.configService.get<string>('API_BASE_URL');
    
    }

    async onModuleInit() {
        //  module initializes
        
    }

    async getAPIHealthCheck(): Promise<any> {
        const APIHealthUrl = `${this.baseUrl}/_health`;

        this.logger.log('Fetching API health from API...');

        try {
            const { data } = await firstValueFrom(
                this.httpService.get<any>(APIHealthUrl).pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error(`Getting API Health failed: ${error.message}`);
                        if (error.response) {
                            this.logger.error(`Response status: ${error.response.status}`);
                            this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
                        }
                        throw new Error(`Getting API Health failed: ${error.message}`);
                    }),
                ),
            );

            if (data) {
                this.logger.log(`API Health:`);
                console.log(data);
                return data;
            }


        } catch (error) {
            this.logger.error('Error getting API health:', error);
            throw error;
        }
    }
}