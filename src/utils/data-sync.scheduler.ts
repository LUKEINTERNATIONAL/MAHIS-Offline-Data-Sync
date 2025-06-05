import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DataSyncService } from './../app.dataSyncService';
import { AuthService, fetchAndSaveUserData, syncPatientIds, makePatientSyncRequest, updatePayload } from './../app.authService';
import { HttpService } from '@nestjs/axios';
import { User, UserDocument } from '../modules/user/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PatientService } from '../modules/patient/patient.service';

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
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    // Get configuration from environment variables with defaults
    this.isEnabled = this.configService.get<string>('SYNC_SCHEDULER_ENABLED') !== 'false';
    
    this.logger.log(`DataSyncScheduler initialized. Enabled: ${this.isEnabled}`);
  }

  /**
   * Implement OnModuleInit to trigger a job 120 seconds after application startup
   */
  async onModuleInit() {
    this.logger.log('Scheduling initial patient record sync in 120 seconds');
    
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

  /**
   * Perform the actual patient record sync operation
   */
  private async syncPatientRecords() {
    await fetchAndSaveUserData(
        this.authService,
        this.userModel,
        this.httpService,
        this.logger
      );
    const result = await this.dataSyncService.syncPatientRecords();
    // 	http://localhost:3000/api/v1//patients/6270/get_patient_record
    await syncPatientIds(
        this.authService,
        this.httpService,
        this.logger,
        this.patientService
      );
    
    // this.logger.log(`Sync operation completed: ${result.message}`);
    // // if (result.failed > 0) {
    // //   this.logger.warn(`${result.failed} records failed to sync`);
    // // }
    
    return result;
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
      throw error;
    }
  }
}