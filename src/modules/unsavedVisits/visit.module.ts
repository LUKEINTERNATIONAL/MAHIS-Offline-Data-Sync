import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { UnsavedVisitsService } from './unsavedVisit.service';
import { VisitService } from '../visit/visit.service';
import { SharedModule } from '../SharedModule/shared.module'
import { StageService } from '../stage/stage.service';

@Module({
  imports: [PrismaModule, SharedModule, HttpModule],
  providers: [UnsavedVisitsService, VisitService, StageService],
  exports: [UnsavedVisitsService, VisitService, StageService],
})
export class unsavedVisitModule {}