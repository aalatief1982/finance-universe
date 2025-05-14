
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    conditions: ['web', 'browser', 'default']
  },
  build: {
    rollupOptions: {
      external: ['capacitor-background-sms-listener']
    }
  },
  optimizeDeps: {
    exclude: ['capacitor-background-sms-listener']
  }
});
