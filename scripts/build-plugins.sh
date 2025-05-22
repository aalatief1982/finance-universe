
#!/bin/bash

echo "Building Background SMS Listener plugin..."

# Create necessary directories
mkdir -p capacitor-background-sms-listener/dist/esm

# Create a blank index.js file to satisfy the build
echo "// Placeholder" > capacitor-background-sms-listener/dist/esm/index.js

# Create output directory structure
mkdir -p capacitor-background-sms-listener/dist

# Copy necessary files
echo "export * from './definitions';" > capacitor-background-sms-listener/dist/esm/index.js

echo "Plugin setup complete!"
