/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { ViteAnalogNestjsApp } from './custom-plugin';


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
    analog({
      apiPrefix: '/api',
    }),

    // VitePluginNode({
    //   adapter: 'nest',
    //   appPath: 'src/api/src/main.ts',
    //   appName: 'nestjs-api',
    //   tsCompiler: 'swc'
    // }),
    ViteAnalogNestjsApp({
      nodeConfig: {
        adapter: 'nest',
        appPath: 'src/api/src/main.ts',
        appName: 'nestjs-api',
        tsCompiler: 'swc'
      }
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
    ]
  }
}));
