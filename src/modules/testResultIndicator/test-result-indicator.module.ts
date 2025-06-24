import { Module } from '@nestjs/common';
import { TestResultIndicatorController } from './test-result-indicator.controller';
import { TestResultIndicatorService } from './test-result-indicator.service'; 
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { TestTypeModule } from '../testTypes/test-type.module'; // <-- Add this import


@Module({
  imports: [
    HttpModule,
    AuthModule,
    TestTypeModule
  ],
  controllers: [TestResultIndicatorController],
  providers: [TestResultIndicatorService],
  exports: [TestResultIndicatorService],
})
export class TestResultIndicatorModule {}
