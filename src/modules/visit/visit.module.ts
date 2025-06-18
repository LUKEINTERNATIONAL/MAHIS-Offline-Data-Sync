import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitSchema, Visit } from './schema/visit.schema';
import { VisitService } from './visit.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }])
  ],
  providers: [VisitService],
  exports: [VisitService, MongooseModule]
})
export class VisitModule {}