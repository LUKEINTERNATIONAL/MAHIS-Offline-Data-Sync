import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthTokenService {
  private token: string | null = null;
  private tokenFetchedAt: number | null = null;
  private readonly TOKEN_TTL = 1000 * 60 * 10; // 10 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async getToken(): Promise<string> {
    const now = Date.now();

    // Reuse token if still valid
    if (this.token && this.tokenFetchedAt && now - this.tokenFetchedAt < this.TOKEN_TTL) {
      return this.token;
    }

    // Fetch fresh token
    const apiUrl = this.configService.get<string>('API_BASE_URL');
    const username = this.configService.get<string>('API_USERNAME');
    const password = this.configService.get<string>('API_PASSWORD');

    const response$ = this.httpService.post(`${apiUrl}/auth/login`, {
      username,
      password,
    });

    const response = await lastValueFrom(response$);

    this.token = response.data.authorization.token;
    this.tokenFetchedAt = now;

    return this.token;
  }
}
