import { Options as SwcOptions } from "@swc/core";
import { Plugin, normalizePath } from "vite";
import { RollupPluginSwc } from "vite-plugin-node";
import { createMiddleware } from "./create-middleware";
import { loadEsmModule } from '@angular-devkit/build-angular/src/utils/load-esm';
import * as ts from "typescript";
import * as path from 'path';
import { CompilerHost, NgtscProgram } from '@angular/compiler-cli';
const {
  augmentProgramWithVersioning,
  augmentHostWithCaching,
} = require('@ngtools/webpack/src/ivy/host');

const {
  mergeTransformers,
  replaceBootstrap,
} = require('@ngtools/webpack/src/ivy/transformation');

interface EmitFileResult {
  content?: string;
  map?: string;
  dependencies: readonly string[];
  hash?: Uint8Array;
}

type FileEmitter = (file: string) => Promise<EmitFileResult | undefined>;

let rootNames: string[];
let compilerOptions: import('@angular/compiler-cli').CompilerOptions;
let host: ts.CompilerHost;
let nextProgram: NgtscProgram | undefined | ts.Program;
let builderProgram: ts.EmitAndSemanticDiagnosticsBuilderProgram;
let fileEmitter: FileEmitter | undefined;
let compilerCli: typeof import('@angular/compiler-cli');


export function ViteAnalogNestjsPlugin(): Plugin[] {
  const swcOptions: SwcOptions = {
    module: {
      type: "es6",
    },
    jsc: {
      target: "es2019",
      parser: {
        syntax: "typescript",
        decorators: true,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
      },
    },
  }

  return [
    {
      name: "vite-analog-nestjs-plugin",
      config: async () => {
        compilerCli = await loadEsmModule<
          typeof import('@angular/compiler-cli')
        >('@angular/compiler-cli')
        return {
          build: {
            ssr: 'server/src/main.ts',
            rollupOptions: {
              input: 'server/src/main.ts',
            },
            outDir: 'dist/server',
          },
          server: {
            hmr: false
          },
          optimizeDeps: {
            exclude: [
              '@swc/core',
              '@angular/platform-server',
              '@analogjs/router'
            ]
          },
          esbuild: false,
        }
      },
      configureServer: async (server) => {
        server.watcher.on('add', setupCompilation);
        server.watcher.on('unlink', setupCompilation);
        server.middlewares.use(await createMiddleware(server));
      },
      transform(code, id) {
        // Remove usage of `with()` in sloppy.js file
        if (id.includes(normalizePath('domino/lib/sloppy.js'))) {
          return {
            code: code.replace(/with\(/gi, 'if('),
          };
        }

        return;
      },
      async buildStart() {
        setupCompilation();

        await buildWithAngularCompiler();
      },
    },
    RollupPluginSwc(swcOptions),
  ]
}

function setupCompilation() {
  const { options: tsCompilerOptions, rootNames: rn } =
    compilerCli.readConfiguration('tsconfig.json', {
      enableIvy: true,
      noEmitOnError: false,
      suppressOutputPathCheck: true,
      outDir: undefined,
      inlineSources: true, // TODO: Base this on production mode
      inlineSourceMap: true, // TODO: Base this on production mode
      sourceMap: false,
      mapRoot: undefined,
      sourceRoot: undefined,
      declaration: false,
      declarationMap: false,
      allowEmptyCodegenFiles: false,
      annotationsAs: 'decorators',
      enableResourceInlining: false,
    });

  rootNames = rn;
  compilerOptions = tsCompilerOptions;
  host = ts.createIncrementalCompilerHost(compilerOptions);
}



async function buildWithAngularCompiler() {
  let builder:
    | ts.BuilderProgram
    | ts.EmitAndSemanticDiagnosticsBuilderProgram;
  let typeScriptProgram: ts.Program;
  let angularCompiler: any;

  // Create the Angular specific program that contains the Angular compiler
  const angularProgram: NgtscProgram = new compilerCli.NgtscProgram(
    rootNames,
    compilerOptions,
    host as CompilerHost,
    nextProgram as any
  );
  angularCompiler = angularProgram.compiler;
  typeScriptProgram = angularProgram.getTsProgram();
  augmentProgramWithVersioning(typeScriptProgram);

  builder = builderProgram =
    ts.createEmitAndSemanticDiagnosticsBuilderProgram(
      typeScriptProgram,
      host,
      builderProgram
    );

  await angularCompiler.analyzeAsync();

  nextProgram = angularProgram;

  const getTypeChecker = () => builder.getProgram().getTypeChecker();
  fileEmitter = createFileEmitter(
    builder,
    mergeTransformers(
      {
        before: [
          replaceBootstrap(getTypeChecker),
        ],
      },
      angularCompiler.prepareEmit().transformers
    ),
  );
}

export function createFileEmitter(
  program: ts.BuilderProgram,
  transformers: ts.CustomTransformers = {},
  onAfterEmit?: (sourceFile: ts.SourceFile) => void
): FileEmitter {
  return async (file: string) => {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) {
      return undefined;
    }

    let content: string | undefined;
    program.emit(
      sourceFile,
      (filename, data) => {
        if (/\.[cm]?js$/.test(filename)) {
          content = data;
        }
      },
      undefined /* cancellationToken */,
      undefined /* emitOnlyDtsFiles */,
      transformers
    );

    onAfterEmit?.(sourceFile);

    return { content, dependencies: [] };
  };
}