import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { StageService } from './stage.service';
import { SharedModule } from '../SharedModule/shared.module'

@Module({
  imports: [PrismaModule, HttpModule, SharedModule],
  providers: [StageService],
  exports: [StageService],
})
export class StageModule {}