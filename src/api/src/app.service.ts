import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private count = 0;

  getCount(): number {
    return this.count;
  }

  increment(): number {
    console.log('incrementing count', this.count);
    this.count++;
    console.log('incrementing count', this.count);

    return this.count;
  }
}
