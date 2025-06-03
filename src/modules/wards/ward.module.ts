import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ward, WardSchema } from './schema/ward.schema';
import { WardController } from './ward.controller';
import { WardService } from './ward.service';
import { HttpModule } from '@nestjs/axios';




@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ward.name, schema: WardSchema }]),
    HttpModule
  ],
  controllers: [WardController],
  providers: [WardService],
  exports: [WardService], 
})
export class WardModule {}
