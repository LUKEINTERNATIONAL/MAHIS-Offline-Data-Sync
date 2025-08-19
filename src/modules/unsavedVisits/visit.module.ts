import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UnsavedVisitsService } from './unsavedVisit.service';
import { SharedModule } from '../SharedModule/shared.module'

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [UnsavedVisitsService],
  exports: [UnsavedVisitsService],
})
export class unsavedVisitModule {}