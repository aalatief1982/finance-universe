
declare module 'vite' {
  export interface ConfigOptions {
    mode: string;
  }

  export function defineConfig(config: any): any;
}

declare module '@vitejs/plugin-react-swc' {
  const reactPlugin: any;
  export default reactPlugin;
}

declare module 'lovable-tagger' {
  export function componentTagger(): {
    name: string;
    transform(code: string, id: string): string;
  };
}
