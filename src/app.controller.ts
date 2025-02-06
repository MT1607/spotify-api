import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('login')
  @Redirect()
  login() {
    const authUrl = this.appService.getAuthorizationUrl();
    return { url: authUrl };
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
    return this.appService.getAccessToken(code);
  }

  @Get('profile')
  async getProfileUser(@Query('access_token') access_token: string) {
    // eslint-disable-next-line no-useless-catch
    try {
      const profile = await this.appService.getUserProfile(access_token);
      return profile;
    } catch (e) {
      throw e;
    }
  }
}
