
import { defineConfig } from "vite"; 
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    // Keep these conditions to properly resolve Capacitor plugins
    conditions: ['web', 'browser', 'default']
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
    port: 8080
  }
});
