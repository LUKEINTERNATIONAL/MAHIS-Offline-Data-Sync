import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ward, WardSchema } from './schema/ward.schema';
import { WardController } from './ward.controller';
import { WardService } from './ward.service';




@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ward.name, schema: WardSchema }]),
  ],
  controllers: [WardController],
  providers: [WardService],
//   exports: [ConceptNameService], 
})
export class WardModule {}
