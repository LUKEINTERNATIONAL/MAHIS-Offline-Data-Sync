import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DataSyncService } from './../app.dataSyncService';
import { AuthService, fetchAndSaveUserData, syncPatientIds, makePatientSyncRequest, updatePayload, updateIfSitePatientCountChanges } from './../app.authService';
import { HttpService } from '@nestjs/axios';
import { PatientService } from '../modules/patient/patient.service';
import { DDE4DataSyncService } from './../app.dde4dataSyncService';
import { DDEService } from '../modules/dde/ddde.service';
import { VisitAndStagesSyncService } from './../app.VisitAndStagesSyncService';
import { UserService } from '../modules/user/user.service';
import { ServerPatientCountService } from '../modules/serverPatientCount/server-patient-count.service';

@Injectable()
export class DataSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(DataSyncScheduler.name);
  private isEnabled: boolean;

  constructor(
    private readonly dataSyncService: DataSyncService,
    private configService: ConfigService,
    private authService: AuthService,
    private readonly httpService: HttpService,
    private readonly patientService: PatientService,
    private readonly DDE4Service: DDE4DataSyncService,
    private readonly ddeService: DDEService,
    private readonly visitAndStagesSyncService: VisitAndStagesSyncService,
    private readonly userService: UserService,
    private readonly serverPatientCountService: ServerPatientCountService,
  ) {
    // Get configuration from environment variables with defaults
    this.isEnabled = this.configService.get<string>('SYNC_SCHEDULER_ENABLED') !== 'false';
    
    this.logger.log(`DataSyncScheduler initialized. Enabled: ${this.isEnabled}`);
  }

  /**
   * Implement OnModuleInit to trigger a job 120 seconds after application startup
   */
  async onModuleInit() {
    
    setTimeout(async () => {
      if (this.isEnabled) {
        this.logger.log('Running initial patient record sync job after 120 second delay');
        try {
          // TODO: Uncomment the line below to enable initial sync
          await this.syncPatientRecords();
        } catch (error) {
          this.logger.error(`Initial sync failed: ${error.message}`);
        }
      }
    }, 1); // 120 seconds = 2 minutes
  }

  /**
   * Scheduled job that runs every hour by default
   * The schedule can be customized using standard cron expressions
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync() {
    if (!this.isEnabled) {
      this.logger.debug('Scheduled sync is disabled, skipping execution');
      return;
    }

    try {
      this.logger.log('Starting scheduled patient record sync');
      // TODO: Uncomment the line below to enable scheduled sync
      await this.syncPatientRecords();
    } catch (error) {
      this.logger.error(`Scheduled sync failed: ${error.message}`, error.stack);
    }
  }

  @Cron('*/30 * * * * *') // Every 30 seconds
async checkPatientCountChanges() {
  if (!this.isEnabled) return;
  
  try {
    await updateIfSitePatientCountChanges(
      this.authService,
      this.httpService, 
      this.logger,
      this.serverPatientCountService,
      () => syncPatientIds(
        this.authService,
        this.httpService,
        this.logger,
        this.patientService,
        this.ddeService
      )
    );
    await this.visitAndStagesSyncService.getStagesViaExternalAPI();
    await this.visitAndStagesSyncService.getVisitsViaExternalAPI();

  } catch (error) {
    this.logger.error(`Patient count check failed: ${error.message}`);
  }
}

  /**
   * Perform the actual patient record sync operation
   */
  private async syncPatientRecords() {
    await this.DDE4Service.getDDEIDSViaExternalAPI();
    await fetchAndSaveUserData(
        this.authService,
        this.userService,
        this.httpService,
        this.logger,
    );
    await this.dataSyncService.syncPatientRecords();
    await syncPatientIds(
        this.authService,
        this.httpService,
        this.logger,
        this.patientService,
        this.ddeService
      );
    await this.visitAndStagesSyncService.getStagesViaExternalAPI();
    await this.visitAndStagesSyncService.getVisitsViaExternalAPI();
  }

  /**
   * Method to manually trigger the sync process
   */
  async triggerManualSync(): Promise<any> {
    this.logger.log('Manual sync triggered');
    try {
      return await this.syncPatientRecords();
    } catch (error) {
      this.logger.error(`Manual sync failed: ${error.message}`, error.stack);
      // throw error;
    }
  }
}