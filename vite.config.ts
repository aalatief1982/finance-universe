
import { defineConfig } from "vitest/config"; 
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Keep these conditions to properly resolve Capacitor plugins
    conditions: ['web', 'browser', 'default'],
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/analytics'],
    esbuildOptions: {
      // Required for Capacitor plugin imports to work
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    port: 8080,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 10,
        statements: 30,
      },
    },
  },
});
