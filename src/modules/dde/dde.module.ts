import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DDEService } from './ddde.service';

@Module({
  imports: [PrismaModule],
  providers: [DDEService],
  exports: [DDEService],
})
export class DDEModule {}