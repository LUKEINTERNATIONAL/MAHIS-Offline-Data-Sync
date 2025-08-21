import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitService } from './visit.service';
import { SharedModule } from '../SharedModule/shared.module'

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}