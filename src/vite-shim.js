
#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('Starting Vite development server...');
  execSync('npx vite', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start Vite:', error.message);
  process.exit(1);
}
