
#!/bin/bash

# Check if vite exists in the project dependencies
if [ -f "./node_modules/.bin/vite" ]; then
  # Make it executable
  chmod +x ./node_modules/.bin/vite
  echo "Vite executable is now ready."
else
  # If vite binary doesn't exist, install it
  echo "Vite binary not found. Installing dependencies..."
  npm install
  # Make it executable after installation
  chmod +x ./node_modules/.bin/vite
  echo "Vite executable is now ready."
fi
