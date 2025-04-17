@echo off
REM Ensure node_modules/.bin exists
if not exist node_modules\.bin (
    mkdir node_modules\.bin
)

REM Delete existing vite link or file if present
if exist node_modules\.bin\vite (
    del node_modules\.bin\vite
)

REM Create a hard link to src\vite-shim.js
mklink /H node_modules\.bin\vite src\vite-shim.js

echo Vite shim setup complete
