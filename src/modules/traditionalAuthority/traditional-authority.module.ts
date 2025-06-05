import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TraditionalAuthority, TraditionalAuthoritySchema } from './schema/traditional-authority.schema';
import { HttpModule } from '@nestjs/axios';
import { TraditionalAuthorityController } from './traditional-authority.controller';
import { TraditionalAuthorityService } from './traditional-authority.service';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: TraditionalAuthority.name, schema: TraditionalAuthoritySchema }]),
    HttpModule,
    AuthModule
  ],
  controllers: [TraditionalAuthorityController],
  providers: [TraditionalAuthorityService],
  exports: [TraditionalAuthorityService], 
})
export class TraditionalAuthorityModule {}
