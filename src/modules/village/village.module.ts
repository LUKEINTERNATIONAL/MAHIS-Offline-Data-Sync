import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Village, VillageSchema } from './schema/village.schema';
import { VillageController } from './village.controller';
import { VillageService } from './village.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Village.name, schema: VillageSchema }]),
    HttpModule
  ],
  controllers: [VillageController],
  providers: [VillageService],
  exports: [VillageService], 
})
export class VillageModule {}
