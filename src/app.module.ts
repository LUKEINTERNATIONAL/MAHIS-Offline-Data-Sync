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
import { AuthService } from './app.authService';
import { User } from './entities/user.entity';

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
      entities: [Payload, User],
      synchronize: true, // Only use in development!
    }),
    
    // Register entities
    TypeOrmModule.forFeature([Payload, User]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthService,
    DataSyncService,
    DataSyncScheduler
  ],
  exports: [AuthService, DataSyncService],
})
export class AppModule {}