import 'zone.js/node';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { Injectable } from '@nestjs/common';

import { config } from '../../src/app/app.config.server';
import { AppComponent } from '../../src/app/app.component';
import url from 'url';
import path from 'path';
import { readFileSync } from 'fs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class AppService {
  private count = 0;

  getHello(): string {
    return 'Hello World from NestJS!';
  }

  increment(): number {
    return this.count++;
  }

  private async bootstrapApplication() {
    return await bootstrapApplication(AppComponent, config);
  }

  render() {
    const indexFile = path.resolve(__dirname, '..', '..', '..', 'index.html');
    const document = readFileSync(indexFile, 'utf8');
    return renderApplication(this.bootstrapApplication, {
      url: '/',
      document,
    });
  }
}
