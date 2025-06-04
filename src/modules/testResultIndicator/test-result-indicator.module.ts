import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestResultIndicator, TestResultIndicatorSchema } from './schema/test-result-indicator.schema';
import { TestResultIndicatorController } from './res-result-indicator.controller';
import { TestResultIndicatorService } from './res-result-indicator.service';
import { TestTypeModule } from '../testTypes/test-type.module';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: TestResultIndicator.name, schema: TestResultIndicatorSchema }]),
    TestTypeModule, HttpModule
  ],

  controllers: [TestResultIndicatorController],
  providers: [TestResultIndicatorService],
  exports: [TestResultIndicatorService], 
})
export class TestResultIndicatorModule {}
