import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Fitness App API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        protected: '/protected (requires auth)',
      },
    };
  }
}
