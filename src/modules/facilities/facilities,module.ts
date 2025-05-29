import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Facility, FacilitySchema } from './schema/facility.schema';
import { FacilityController } from './facilities.controller';
import { FacilityService } from './facilities.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Facility.name, schema: FacilitySchema }]),
  ],
  controllers: [FacilityController],
  providers: [FacilityService],
//   exports: [ConceptNameService], 
})
export class FacilityModule {}
