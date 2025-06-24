import { Module } from '@nestjs/common';
import { VillageController } from './village.controller';
import { VillageService } from './village.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [VillageController],
  providers: [VillageService],
  exports: [VillageService], 
})
export class VillageModule {}
