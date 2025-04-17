
#!/usr/bin/env node

// Set the WS_TOKEN environment variable for development
process.env.WS_TOKEN = process.env.WS_TOKEN || "development";

console.log('Starting Vite development server...');
console.log('Server running at http://localhost:8080');
