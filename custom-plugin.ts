import { Options } from '@analogjs/platform';
import { INestApplication } from "@nestjs/common";
import { IncomingMessage, ServerResponse } from "http";
import { exit } from "process";
import { ConfigEnv, Connect, Plugin, UserConfig, ViteDevServer } from "vite";
import { RequestAdapter, ViteConfig, VitePluginNodeConfig } from "vite-plugin-node";


let prevApp: INestApplication;
const env: ConfigEnv = { command: 'serve', mode: '' };

const NestHandler: RequestAdapter<INestApplication> = async ({ app, req, res }) => {
  // @ts-expect-error nest app typing error
  if (!app.isInitialized) {
    if (prevApp)
      await prevApp.close();

    await app.init();
    prevApp = app;
  }

  const instance = app.getHttpAdapter().getInstance();

  if (typeof instance === 'function') {
    instance(req, res);
  } else {
    const fastifyApp = await instance.ready();
    fastifyApp.routing(req, res);
  }
}

export const getPluginConfig = async (
  server: ViteDevServer,
): Promise<VitePluginNodeConfig> => {
  const plugin = server.config.plugins.find(
    p => p.name === 'vite-plugin-analog-nestjs-app',
  ) as Plugin;

  let userConfig: UserConfig | null | void = null;

  if (typeof plugin.config === 'function')
    userConfig = await plugin.config({}, env);

  if (userConfig)
    return (userConfig as ViteConfig).VitePluginNodeConfig;

  console.error('Please setup VitePluginNode in your vite.config.js first');
  exit(1);
};

export function isObject(item: any): item is object {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export default function mergeDeep(target: object, source: object) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      // @ts-expect-error access unknow property
      if (isObject(source[key])) {
        if (!(key in target)) {
          // @ts-expect-error access unknow property
          Object.assign(output, { [key]: source[key] });
        } else {
          // @ts-expect-error access unknow property
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        // @ts-expect-error access unknow property
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}


export function ViteAnalogNestjsApp(cfg: { nodeConfig: VitePluginNodeConfig } & Options): Plugin[] {
  const swcOptions = mergeDeep({
    module: {
      type: 'es6',
    },
    jsc: {
      target: 'es2019',
      parser: {
        syntax: 'typescript',
        decorators: true,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
      },
    },
  }, cfg.nodeConfig.swcOptions ?? {});

  const config: VitePluginNodeConfig = {
    appPath: cfg.nodeConfig.appPath,
    adapter: cfg.nodeConfig.adapter,
    appName: cfg.nodeConfig.appName ?? 'app',
    tsCompiler: cfg.nodeConfig.tsCompiler ?? 'esbuild',
    exportName: cfg.nodeConfig.exportName ?? 'viteNodeApp',
    swcOptions,
  };

  return [
    // Route all requests starting with /api to the NestJS app
    {
      name: 'vite-plugin-analog-nestjs-app',
      config: () => {
        const plugincConfig: UserConfig & { VitePluginNodeConfig: VitePluginNodeConfig } = {
          VitePluginNodeConfig: config,
        };

        plugincConfig.esbuild = false;
        return plugincConfig;
      },
      configureServer(server) {
        server.middlewares.use('/api', async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          const config = await getPluginConfig(server);
          const appModule = await server.ssrLoadModule(config.appPath);
          let app = appModule[config.exportName!];
          if (!app) {
            process.exit(1);
          } else {
            app = await app;
            await NestHandler({ app, server, req, res, next });
          }
        });
      },
    },
  ];
}