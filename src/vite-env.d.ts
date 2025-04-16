
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
