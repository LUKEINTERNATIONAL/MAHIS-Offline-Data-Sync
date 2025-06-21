import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VisitService } from './visit.service';

@Module({
  imports: [PrismaModule],
  providers: [VisitService],
  exports: [VisitService],
})
export class VisitModule {}