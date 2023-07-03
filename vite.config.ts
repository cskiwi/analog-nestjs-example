/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import { nestRequestAdapter } from './vite/vite-analog-nestjs-plugin/nest-request-adapter';
import { ViteAnalogNestjsPlugin } from './vite/vite-analog-nestjs-plugin/vite-analog-nestjs-plugin';


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'src/assets',
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    ViteAnalogNestjsPlugin(),
    // VitePluginNode({
    //   adapter: nestRequestAdapter,
    //   appPath: 'server/src/main.ts',
    //   appName: 'nestjs-api',
    //   tsCompiler: 'swc'
    // }),
    // analog(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test.ts'],
    include: ['**/*.spec.ts'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
  optimizeDeps: {
    // Vite does not work well with optionnal dependencies,
    // mark them as ignored for now
    // see: https://github.com/axe-me/vite-plugin-node/blob/main/examples/nest/vite.config.ts
    exclude: [
      '@nestjs/microservices',
      '@nestjs/websockets',
      'cache-manager',
      'class-transformer',
      'class-validator',
      'fastify-swagger',
    ]
  }
}));

