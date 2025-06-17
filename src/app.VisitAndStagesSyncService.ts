import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './app.authService';
import { VisitService } from './modules/visit/visit.service';
import { StageService } from './modules/stage/stage.service';
import { lastValueFrom } from "rxjs";

@Injectable()
export class VisitAndStagesSyncService {
    private readonly Visitlogger = new Logger(VisitService.name);
    private readonly Stagelogger = new Logger(StageService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly visitService: VisitService,
        private readonly stageService: StageService,
    ) {}

    async getVisitsViaExternalAPI(): Promise<any> {
    
    }

    async getStagesViaExternalAPI(): Promise<any> {
        try {
            const isAuthenticated = await this.authService.ensureAuthenticated();
            if (!isAuthenticated) {
                throw new Error('Failed to authenticate');
            }

            this.Stagelogger.log(`Syncing stages`);

            const GET_STAGES_URL = `${this.authService.getBaseUrl()}/stages/active_stages`;

            const { data: responseData } = await lastValueFrom(
                this.httpService.get(GET_STAGES_URL, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: this.authService.getAuthToken(),
                    },
                })
            );

            if (responseData) {
                function transformStageData(flatStages: any[]): any[] {
                    return flatStages.map(stage => {
                    const { id, ...data } = stage;
                    return {
                        id,
                        data: {
                            id,
                            ...data
                        }
                    };
                    });
                }

                // Usage:
                const transformedStages = transformStageData(responseData);
                this.stageService.createMany(transformedStages);
            }

        } catch (error) {
            this.Stagelogger.error(`Error syncing stages: ${error.message}`, error.stack);
        }
    }
}