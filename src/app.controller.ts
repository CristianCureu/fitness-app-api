import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { User } from './auth/decorators/user.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running',
    };
  }

  @Get('protected')
  @UseGuards(AuthGuard)
  getProtected(@User() user: any) {
    return {
      message: 'This is a protected route',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
