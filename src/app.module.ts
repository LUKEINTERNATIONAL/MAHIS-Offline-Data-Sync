import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DataSyncService } from "./app.dataSyncService";
import { DataSyncScheduler } from "./utils/data-sync.scheduler";
import { AuthService } from "./app.authService";
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
import { ProgramModule } from "./modules/programs/program.module";
import { TestTypeModule } from "./modules/testTypes/test-type.module";
import { FacilitiesModule } from "./modules/facilities/facilities.module";
import { CountryModule } from "./modules/country/country.module";
import { LoadDataOnStartService } from "./services/load-data-on-start.service";
import { VillageModule } from "./modules/village/village.module";
import { SpecimenModule } from "./modules/specimen/specimen.module";
import { UserModule } from './modules/user/user.module';
import { AuthModule } from "./modules/auth/auth.module";
import { DDE4DataSyncService } from "./app.dde4dataSyncService";
import { ServerTimeService } from "./app.serverTimeService";
import { DDEModule } from "./modules/dde/dde.module";
import { ServerPatientCountModule } from "./modules/serverPatientCount/server-patient-count.module";
import { VisitModule } from "./modules/visit/visit.module";
import { VisitService } from "./modules/visit/visit.service";
import { StageModule } from "./modules/stage/stage.module";
import { StageService } from "./modules/stage/stage.service";
import { VisitAndStagesSyncService } from "./app.VisitAndStagesSyncService";
import { PrismaModule } from "./modules/prisma/prisma.module";

@Module({
  imports: [
    // Config module for environment variables
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere
    }),
    // HTTP module for API requests
    HttpModule,

    // Scheduler module for cron jobs
    ScheduleModule.forRoot(),

    // Prisma database configuration (replaces MongooseModule)
    PrismaModule,
  
    // Register modules (same as before)
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
    ProgramModule,
    TestTypeModule,
    FacilitiesModule, 
    CountryModule,
    VillageModule,
    SpecimenModule,
    UserModule, 
    AuthModule,
    DDEModule,
    ServerPatientCountModule,
    VisitModule,
    StageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    DataSyncService,
    DataSyncScheduler,
    SyncGateway,
    LoadDataOnStartService,
    DDE4DataSyncService,
    VisitService,
    StageService,
    VisitAndStagesSyncService,
    ServerTimeService,
  ],
  exports: [AuthService, DataSyncService, DDE4DataSyncService, ServerTimeService],
})
export class AppModule {}