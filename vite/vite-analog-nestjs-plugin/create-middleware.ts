import { ViteDevServer, Connect } from "vite";
import { nestRequestAdapter } from "./nest-request-adapter";
import { IncomingMessage, ServerResponse } from "http";

export const createMiddleware = async (
  server: ViteDevServer,
): Promise<Connect.HandleFunction> => {
  const requestHandler = nestRequestAdapter

  if (!requestHandler) {
    console.error('Failed to find a request handler');
    process.exit(1);
  }

  return async function (
    req: IncomingMessage,
    res: ServerResponse,
    next: Connect.NextFunction,
  ): Promise<void> {
    const appModule = await server.ssrLoadModule('server/src/main.ts');
    let app = appModule["viteNodeApp"]
    if (!app) {
      console.error('Failed to find a nest application');
      process.exit(1);
    } else {
      app = await app;
      await requestHandler({ app, server, req, res, next });
    }
  };
};