
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    conditions: ['web', 'browser', 'default']
  },
  server: {
    port: 8080
  },
  build: {
    rollupOptions: {
      // Don't try to bundle these Capacitor plugins
      external: ['@capacitor/core', '@capacitor/app', '@capacitor/local-notifications', '@capacitor/status-bar']
    }
  },
  optimizeDeps: {
    exclude: ['@capacitor/core', '@capacitor/app', '@capacitor/local-notifications', '@capacitor/status-bar']
  }
});
