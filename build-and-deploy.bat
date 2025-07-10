@echo off
setlocal EnableDelayedExpansion

:: Step 1: Build the project
echo === Running npm build ===
call npm run build
if errorlevel 1 exit /b

:: Step 2: Change to dist directory
cd dist

:: Step 3: Zip contents into www.zip
echo === Creating www.zip ===
"C:\Program Files\7-Zip\7z.exe" a ..\www.zip *
if errorlevel 1 exit /b

:: Step 4: Move www.zip to public folder
echo === Moving www.zip to public folder ===
move /Y ..\www.zip ..\public\
if errorlevel 1 exit /b

:: Step 5: Update manifest.json version
echo === Updating manifest.json version ===
cd ..\public

powershell -Command "$p='manifest.json'; $j=Get-Content $p | ConvertFrom-Json; $v=$j.version -split '\.'; $maj=[int]$v[0]; $min=[int]$v[1]; $pat=[int]$v[2]+1; if($pat -gt 99){$pat=0;$min++}; $j.version=\"$maj.$min.$pat\"; $j | ConvertTo-Json -Depth 10 | Set-Content $p"

echo ✅ Version bumped successfully


:: Step 6: Go back to root and deploy with Firebase
cd ..
echo === Deploying to Firebase ===
firebase deploy

echo === DONE ===
pause
