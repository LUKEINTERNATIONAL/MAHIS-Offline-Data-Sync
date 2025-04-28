"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DataSyncScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSyncScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const app_dataSyncService_1 = require("./../app.dataSyncService");
const app_authService_1 = require("./../app.authService");
let DataSyncScheduler = DataSyncScheduler_1 = class DataSyncScheduler {
    constructor(dataSyncService, configService, authService) {
        this.dataSyncService = dataSyncService;
        this.configService = configService;
        this.authService = authService;
        this.logger = new common_1.Logger(DataSyncScheduler_1.name);
        this.isEnabled = this.configService.get('SYNC_SCHEDULER_ENABLED') !== 'false';
        this.logger.log(`DataSyncScheduler initialized. Enabled: ${this.isEnabled}`);
    }
    async onModuleInit() {
        this.logger.log('Scheduling initial patient record sync in 120 seconds');
        setTimeout(async () => {
            if (this.isEnabled) {
                this.logger.log('Running initial patient record sync job after 120 second delay');
                try {
                    await this.syncPatientRecords();
                }
                catch (error) {
                    this.logger.error(`Initial sync failed: ${error.message}`);
                }
            }
        }, 1);
    }
    async scheduledSync() {
        if (!this.isEnabled) {
            this.logger.debug('Scheduled sync is disabled, skipping execution');
            return;
        }
        try {
            this.logger.log('Starting scheduled patient record sync');
            await this.syncPatientRecords();
        }
        catch (error) {
            this.logger.error(`Scheduled sync failed: ${error.message}`, error.stack);
        }
    }
    async syncPatientRecords() {
        await this.authService.fetchAndSaveUserData();
        const result = await this.dataSyncService.syncPatientRecords();
        await this.authService.syncPatientIds();
        this.logger.log(`Sync operation completed: ${result.message}`);
        return result;
    }
    async triggerManualSync() {
        this.logger.log('Manual sync triggered');
        try {
            return await this.syncPatientRecords();
        }
        catch (error) {
            this.logger.error(`Manual sync failed: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.DataSyncScheduler = DataSyncScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DataSyncScheduler.prototype, "scheduledSync", null);
exports.DataSyncScheduler = DataSyncScheduler = DataSyncScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_dataSyncService_1.DataSyncService,
        config_1.ConfigService,
        app_authService_1.AuthService])
], DataSyncScheduler);
//# sourceMappingURL=data-sync.scheduler.js.map