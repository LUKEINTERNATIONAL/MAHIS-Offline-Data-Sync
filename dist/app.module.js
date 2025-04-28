"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const app_dataSyncService_1 = require("./app.dataSyncService");
const data_sync_scheduler_1 = require("./utils/data-sync.scheduler");
const payload_entity_1 = require("./payload.entity");
const app_authService_1 = require("./app.authService");
const user_entity_1 = require("./entities/user.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            axios_1.HttpModule,
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'database.sqlite',
                entities: [payload_entity_1.Payload, user_entity_1.User],
                synchronize: true,
            }),
            typeorm_1.TypeOrmModule.forFeature([payload_entity_1.Payload, user_entity_1.User]),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            app_authService_1.AuthService,
            app_dataSyncService_1.DataSyncService,
            data_sync_scheduler_1.DataSyncScheduler
        ],
        exports: [app_authService_1.AuthService, app_dataSyncService_1.DataSyncService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map