import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DataSyncService } from "./app.dataSyncService";
import { DataSyncScheduler } from "./utils/data-sync.scheduler";
import { Payload } from "./payload.entity";
import { AuthService } from "./app.authService";
import { User } from "./entities/user.entity";
import { SyncGateway } from "./websocket/gateways/sync.gateway";
import { MongooseModule } from "@nestjs/mongoose";
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
import { FacilityModule } from "./modules/facilities/facilities,module";
import { CountryModule } from "./modules/country/country.module";
import { LoadDataOnStartService } from "./services/load-data-on-start.service";
import { VillageModule } from "./modules/village/village.module";
import { SpecimenModule } from "./modules/specimen/specimen.module";

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
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "database.sqlite",
      entities: [Payload, User],
      synchronize: true, // Only use in development!
    }),
  
    // Register entities
    TypeOrmModule.forFeature([Payload, User]),
    MongooseModule.forRoot("mongodb://localhost:27017/mahis"),
    ConceptNameModule,
    WardModule,
    PatientModule,
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
    SpecimenModule 
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    DataSyncService,
    DataSyncScheduler,
    SyncGateway,
    LoadDataOnStartService
  ],
  // exports: [AuthService, DataSyncService],
})
export class AppModule {}
