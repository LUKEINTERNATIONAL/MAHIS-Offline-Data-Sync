import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StageService } from './stage.service';

@Module({
  imports: [PrismaModule],
  providers: [StageService],
  exports: [StageService],
})
export class StageModule {}