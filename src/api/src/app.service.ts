import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private count = 0;

  getHello(): string {
    return 'Hello World from NestJS!';
  }

  increment(): number {
    return this.count++;
  }
}
