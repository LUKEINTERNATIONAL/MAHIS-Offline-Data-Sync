import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TraditionalAuthorityController } from './traditional-authority.controller';
import { TraditionalAuthorityService } from './traditional-authority.service';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [TraditionalAuthorityController],
  providers: [TraditionalAuthorityService],
  exports: [TraditionalAuthorityService], 
})
export class TraditionalAuthorityModule {}
