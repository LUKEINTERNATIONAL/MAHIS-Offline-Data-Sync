import { Module } from '@nestjs/common';
import { FacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
  exports: [FacilitiesService],
})
export class FacilitiesModule {}
