import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpecimenController } from './specimen.controller';
import { SpecimenService } from './specimen.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [SpecimenController],
  providers: [SpecimenService],
  exports: [SpecimenService], 
})
export class SpecimenModule {}
