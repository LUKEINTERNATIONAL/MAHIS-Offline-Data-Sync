import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Facility, FacilitySchema } from './schema/facility.schema';
import { FacilityController } from './facilities.controller';
import { FacilityService } from './facilities.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Facility.name, schema: FacilitySchema }]),
    HttpModule
  ],
  controllers: [FacilityController],
  providers: [FacilityService],
  exports: [FacilityService], 
})
export class FacilityModule {}
