
/// <reference types="vite/client" />

// Define the missing __dirname global
declare const __dirname: string;

// Define types for componentTagger
declare module 'lovable-tagger' {
  export function componentTagger(): {
    name: string;
    transform(code: string, id: string): string;
  };
}

// Define types for modules without type definitions
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.md' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
