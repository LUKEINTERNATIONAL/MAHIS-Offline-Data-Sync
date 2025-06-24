import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServerPatientCountService } from './server-patient-count.service';

@Module({
  imports: [PrismaModule],
  providers: [ServerPatientCountService],
  exports: [ServerPatientCountService]
})
export class ServerPatientCountModule {}