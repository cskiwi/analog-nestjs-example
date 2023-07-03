import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  return app;
}

if (import.meta.env.PROD) {
  async function bootstrap() {
    const app = await createApp();
    app.init();
    await app.listen(3000);
  }

  bootstrap();
}

export const viteNodeApp = createApp();
