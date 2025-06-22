import { Module } from '@nestjs/common';
import { TestTypeController } from './test-type.controller';
import { TestTypeService } from './test-type.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [TestTypeController],
  providers: [TestTypeService],
  exports: [TestTypeService], 
})
export class TestTypeModule {}
