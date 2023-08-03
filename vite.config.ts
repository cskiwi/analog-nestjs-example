/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import { nestRequestAdapter } from './nest-request-adapter';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'src/assets',
  build: {
    target: ['es2020'],
  },
  plugins: [
    VitePluginNode({
      adapter: nestRequestAdapter,
      appPath: 'src/api/src/main.ts',
      appName: 'nestjs-api',
      tsCompiler: 'swc',
    }),
    analog({
      nitro: {
        preset: 'vercel',
      },
    }),
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
    ],
  },
}));
