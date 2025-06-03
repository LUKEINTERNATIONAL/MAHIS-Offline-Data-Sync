import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Country, CountrySchema } from './schema/country.schema';
import { CountryController } from './country.controller';
import { CountryService } from './country.service';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Country.name, schema: CountrySchema }]),
    HttpModule
  ],
  controllers: [CountryController],
  providers: [CountryService],
  exports: [CountryService], 
})
export class CountryModule {}
