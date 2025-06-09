import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DataSyncService } from "./app.dataSyncService";
import { DataSyncScheduler } from "./utils/data-sync.scheduler";
import { AuthService } from "./app.authService";
import { User } from "./entities/user.entity";
import { SyncGateway } from "./websocket/gateways/sync.gateway";
import { ConceptNameModule } from "./modules/conceptName/concept-name.module";
import { WardModule } from "./modules/wards/ward.module";
import { PatientModule } from "./modules/patient/patient.module";
import { TraditionalAuthorityModule } from "./modules/traditionalAuthority/traditional-authority.module";
import { ConceptSetModule } from "./modules/conceptSet/concept-set.module";
import { DrugModule } from "./modules/drugs/drug.module";
import { DiagnosisModule } from "./modules/diagnosis/diagnosis.module";
import { RelationshipModule } from "./modules/relationship/relationship.module";
import { TestResultIndicatorModule } from "./modules/testResultIndicator/test-result-indicator.module";
import { StockModule } from "./modules/stock/stock.module";
import { Village } from "./modules/village/schema/village.schema";
import { ProgramModule } from "./modules/programs/program.module";
import { TestTypeModule } from "./modules/testTypes/test-type.module";
import { FacilityModule } from "./modules/facilities/facilities.module";
import { CountryModule } from "./modules/country/country.module";
import { LoadDataOnStartService } from "./services/load-data-on-start.service";
import { VillageModule } from "./modules/village/village.module";
import { SpecimenModule } from "./modules/specimen/specimen.module";
import { UserModule } from './modules/user/user.module';
import { AuthModule } from "./modules/auth/auth.module";
import { DDE4DataSyncService } from "./app.dde4dataSyncService";
import { DDEModule } from "./modules/dde/dde.module";

@Module({
  imports: [
    // Config module for environment variables
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    // HTTP module for API requests
    HttpModule,

    // Scheduler module for cron jobs
    ScheduleModule.forRoot(),

    // Database configuration
    MongooseModule.forRoot("mongodb://localhost:27017/test"),
  
    // Register entities
    PatientModule,
    ConceptNameModule,
    WardModule,
    TraditionalAuthorityModule,
    ConceptSetModule,
    DrugModule,
    DiagnosisModule,
    RelationshipModule,
    TestResultIndicatorModule,
    StockModule,
    Village,
    ProgramModule,
    TestTypeModule,
    FacilityModule, 
    CountryModule,
    VillageModule,
    SpecimenModule,
    UserModule, 
    AuthModule,
    DDEModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    DataSyncService,
    DataSyncScheduler,
    SyncGateway,
    LoadDataOnStartService,
    DDE4DataSyncService
  ],
  exports: [AuthService, DataSyncService, DDE4DataSyncService],
})
export class AppModule {}
