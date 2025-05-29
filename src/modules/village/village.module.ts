import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Village, VillageSchema } from './schema/village.schema';
import { VillageController } from './village.controller';
import { VillageService } from './village.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Village.name, schema: VillageSchema }]),
  ],
  controllers: [VillageController],
  providers: [VillageService],
//   exports: [ConceptNameService], 
})
export class VillageModule {}
