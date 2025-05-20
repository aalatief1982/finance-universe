
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
  optimizeDeps: {
    exclude: ['@capacitor/core', '@capacitor/app', '@capacitor/local-notifications', '@capacitor/status-bar']
  },
  build: {
    rollupOptions: {
      external: ['@capacitor/core', '@capacitor/app', '@capacitor/local-notifications', '@capacitor/status-bar'],
      output: {
        globals: {
          '@capacitor/core': 'capacitorExports',
          '@capacitor/app': 'capacitorApp',
          '@capacitor/local-notifications': 'capacitorLocalNotifications',
          '@capacitor/status-bar': 'capacitorStatusBar'
        }
      }
    }
  }
});
