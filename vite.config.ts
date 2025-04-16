
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

interface ConfigOptions {
  mode: string;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigOptions) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    (() => ({
      name: 'component-tagger',
      transform(code: string, id: string) {
        return code;
      },
    }))(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
