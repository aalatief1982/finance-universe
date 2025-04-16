
#!/bin/bash
chmod +x ./src/vite-shim.js
ln -sf ./src/vite-shim.js ./node_modules/.bin/vite
echo "Vite shim setup complete"

