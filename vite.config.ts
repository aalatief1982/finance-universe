import { defineConfig } from "vite"; 
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins = [react()];
  
  // Only add componentTagger in development mode
  if (mode === 'development') {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('lovable-tagger not available:', error);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
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
  };
});
