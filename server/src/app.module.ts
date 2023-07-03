import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AngularUniversalModule } from '@nestjs/ng-universal';
import { bootstrapApplication } from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { config } from '../../src/app/app.config.server';
import { AppComponent } from '../../src/app/app.component';
import { join } from 'path';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
// import * as url from 'url';
// import * as path from 'path';

// const getServeStaticModule = () => {
//   if (import.meta.env.PROD) {
//     const __filename = url.fileURLToPath(import.meta.url);
//     const __dirname = path.dirname(__filename);

//     return [
//       ServeStaticModule.forRoot({
//         rootPath: join(__dirname, '..', 'client'),
//         exclude: ['/api*'],
//       }),
//     ];
//   }

//   return [];
// };

@Module({
  imports: [
    // AngularUniversalModule.forRoot({
    //   bootstrap: bootstrapApplication(AppComponent, config),
    //   viewsPath: join(process.cwd(), 'dist', 'client'),
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
