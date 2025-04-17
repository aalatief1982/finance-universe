
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Find the actual vite executable
const viteExecutablePath = path.resolve(__dirname, '../node_modules/.bin/vite');

// Execute vite with all the arguments passed to this script
const viteProcess = spawn(viteExecutablePath, process.argv.slice(2), {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('close', (code) => {
  process.exit(code);
});
