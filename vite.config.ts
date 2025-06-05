
import { defineConfig } from "vite"; 
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // Keep these conditions to properly resolve Capacitor plugins
    conditions: ['web', 'browser', 'default']
  },
  optimizeDeps: {
    esbuildOptions: {
      // Required for Capacitor plugin imports to work
      define: {
        global: 'globalThis',
      },
    },
  },
}));
