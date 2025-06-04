import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from './schema/country.schema';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CountryService {
  constructor(
    @InjectModel(Country.name)
    private countryModel: Model<CountryDocument>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async create(data: Partial<Country>): Promise<Country> {
    return this.countryModel.create(data);
  }

  async findAll(): Promise<Country[]> {
    return this.countryModel.find().exec();
  }

  async findById(id: number): Promise<Country | null> {
    return this.countryModel.findOne({ id }).exec();
  }

  async update(id: number, data: Partial<Country>): Promise<Country | null> {
    return this.countryModel.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: number): Promise<Country | null> {
    return this.countryModel.findOneAndDelete({ id }).exec();
  }

  async loadCountries(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('API_BASE_URL');
  
      // Authenticate
      const authResponse$ = this.httpService.post(`${apiUrl}/auth/login`, {
        username: this.configService.get<string>('API_USERNAME'),
        password: this.configService.get<string>('API_PASSWORD'),
      });
      const authResponse = await lastValueFrom(authResponse$);
      const token = authResponse.data.authorization.token;
  
      const headers = {
        Authorization: token,
      };
  
      // Create 4 GET requests for region_id 1 to 4
      const requests = [1, 2, 3, 4].map(regionId =>
        this.httpService.request({
          method: 'GET',
          url: `${apiUrl}/districts?paginate=false`,
          headers,
          data: { region_id: regionId, paginate: false },
        })
      );
  
      const responses = await Promise.all(requests.map(req => lastValueFrom(req)));
  
      const allCountries = responses.flatMap(res => res.data);
   
      const bulkOps = allCountries.map(({ district_id, ...rest }) => ({
        updateOne: {
          filter: { district_id },
          update: { $set: { district_id, ...rest } },
          upsert: true,
        },
      }));
  
      if (bulkOps.length > 0) {
        await this.countryModel.bulkWrite(bulkOps);
        console.log(`${bulkOps.length} countries loaded from all regions.`);
      } else {
        console.log('No countries found to upsert.');
      }
    } catch (error) {
      console.error('Failed to load countries:', error?.response?.data || error);
      throw new Error('Could not load countries');
    }
  }
  
}
