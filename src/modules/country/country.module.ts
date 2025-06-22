import { Module } from '@nestjs/common';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule
  ],
  controllers: [CountryController],
  providers: [CountryService],
  exports: [CountryService], 
})
export class CountryModule {}
