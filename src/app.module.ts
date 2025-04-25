import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSyncService } from './app.dataSyncService';
import { DataSyncScheduler } from './utils/data-sync.scheduler';
import { Payload } from './payload.entity';

@Module({
  imports: [
    // Config module for environment variables
    ConfigModule.forRoot(),
    
    // HTTP module for API requests
    HttpModule,
    
    // Scheduler module for cron jobs
    ScheduleModule.forRoot(),
    
    // Database configuration
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Payload],
      synchronize: true, // Only use in development!
    }),
    
    // Register entities
    TypeOrmModule.forFeature([Payload]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DataSyncService,
    DataSyncScheduler
  ],
})
export class AppModule {}