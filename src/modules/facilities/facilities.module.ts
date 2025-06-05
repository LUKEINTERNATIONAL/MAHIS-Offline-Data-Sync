import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Facility, FacilitySchema } from './schema/facility.schema';
import { FacilityController } from './facilities.controller';
import { FacilityService } from './facilities.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Facility.name, schema: FacilitySchema }]),
    HttpModule,
    AuthModule
  ],
  controllers: [FacilityController],
  providers: [FacilityService],
  exports: [FacilityService], 
})
export class FacilityModule {}
