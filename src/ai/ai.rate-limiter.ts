import { HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export class AiRateLimiter {
  private readonly store = new Map<string, number[]>();

  constructor(private options: RateLimitOptions) {}

  enforce(key: string) {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    const entries = this.store.get(key) || [];
    const recent = entries.filter((ts) => ts >= windowStart);

    if (recent.length >= this.options.max) {
      throw new HttpException('Too many AI requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(now);
    this.store.set(key, recent);
  }
}
