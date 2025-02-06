import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private accessToken: string | null = null;
  private tokenExpirationTime: number | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.clientId = <string>this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = <string>(
      this.configService.get<string>('SPOTIFY_CLIENT_SECRET')
    );
    this.redirectUri = <string>(
      this.configService.get<string>('SPOTIFY_REDIRECT_URI')
    );
  }

  getAuthorizationUrl(): string {
    const scope = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope,
      redirect_uri: this.redirectUri,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<any> {
    const url = 'https://accounts.spotify.com/api/token';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
    });

    const header = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic  ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, params.toString(), {
          headers: header,
        }),
      );

      this.accessToken = response.data.access_token;
      this.tokenExpirationTime = Date.now() + response.data.expires_in * 1000;

      return response.data;
    } catch (e) {
      throw new UnauthorizedException('Failed to get access token', e);
    }
  }

  async getClientCredentialsToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpirationTime &&
      Date.now() < this.tokenExpirationTime
    ) {
      return this.accessToken;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
    });

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://accounts.spotify.com/api/token',
          params.toString(),
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.accessToken = response.data.access_token;
      this.tokenExpirationTime = Date.now() + response.data.access_token * 1000;

      return this.accessToken || '';
    } catch (e) {
      throw new UnauthorizedException(
        'Failed to get client credentials token',
        e,
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const url = 'https://accounts.spotify.com/api/token';
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, params.toString(), {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return response.data;
    } catch (e) {
      throw new UnauthorizedException('Failed to get refresh token', e);
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    const url = 'https://api.spotify.com/v1/me';
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer  ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (e) {
      throw new UnauthorizedException('Failed to get user profile', e);
    }
  }
}
