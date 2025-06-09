import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DDE, DDESchema } from './schema/dde.shema';
import { DDEService } from './ddde.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DDE.name, schema: DDESchema }]),
  ],
  providers: [DDEService],
  exports: [DDEService, MongooseModule],
})
export class DDEModule {}