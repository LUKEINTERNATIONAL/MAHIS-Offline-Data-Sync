import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StageSchema, Stage } from './schema/stage.schema';
import { StageService } from './stage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stage.name, schema: StageSchema }])
  ],
  providers: [StageService],
  exports: [StageService, MongooseModule]
})
export class StageModule {}