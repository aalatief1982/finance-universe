
declare module 'vite' {
  export interface ConfigEnv {
    command: 'build' | 'serve';
    mode: string;
  }

  export interface UserConfig {
    root?: string;
    base?: string;
    mode?: string;
    define?: Record<string, any>;
    plugins?: any[];
    publicDir?: string;
    cacheDir?: string;
    resolve?: {
      alias?: Record<string, string> | Array<{ find: string | RegExp; replacement: string }>;
      dedupe?: string[];
      conditions?: string[];
      mainFields?: string[];
      extensions?: string[];
    };
    css?: Record<string, any>;
    json?: Record<string, any>;
    esbuild?: Record<string, any> | false;
    assetsInclude?: string | RegExp | (string | RegExp)[];
    optimizeDeps?: {
      entries?: string | string[];
      exclude?: string[];
      include?: string[];
      force?: boolean;
    };
    server?: {
      host?: string | boolean;
      port?: number;
      strictPort?: boolean;
      https?: boolean | Record<string, any>;
      open?: boolean | string;
      proxy?: Record<string, any>;
      cors?: boolean | Record<string, any>;
      headers?: Record<string, string>;
    };
    build?: Record<string, any>;
    preview?: Record<string, any>;
    ssr?: Record<string, any>;
  }

  export function defineConfig(config: UserConfig | ((env: ConfigEnv) => UserConfig)): UserConfig;
}

declare module '@vitejs/plugin-react-swc' {
  function reactSWC(options?: any): any;
  export default reactSWC;
}

declare module 'path' {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function extname(path: string): string;
  export function isAbsolute(path: string): boolean;
  export function relative(from: string, to: string): string;
  export function normalize(path: string): string;
  export function parse(path: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  };
  export const sep: string;
  export const delimiter: string;
}

declare module 'lovable-tagger' {
  export function componentTagger(): {
    name: string;
    transform(code: string, id: string): string;
  };
}
