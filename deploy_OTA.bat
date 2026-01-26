@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ==========================
REM Config
REM ==========================
set "DIST_DIR=dist"
set "PUBLIC_DIR=public"
set "MANIFEST=%PUBLIC_DIR%\manifest.json"
set "TARGET_ZIP=%PUBLIC_DIR%\www.zip"
set "ZIP_PREFIX=app.xpensia.com_"

echo.
echo ==========================
echo 1) npm run build
echo ==========================
call npm run build
if errorlevel 1 (
  echo Build failed. Aborting.
  exit /b 1
)

echo.
echo ==========================
echo 2) Capgo bundle zip
echo ==========================
call npx @capgo/cli@latest bundle zip --path "%DIST_DIR%"
if errorlevel 1 (
  echo Capgo bundle failed. Aborting.
  exit /b 1
)

echo.
echo ==========================
echo 3) Find newest "%ZIP_PREFIX%*.zip" in repo root
echo ==========================
set "NEW_ZIP="
for /f "delims=" %%F in ('dir /b /a:-d /o:-d "%ZIP_PREFIX%*.zip" 2^>nul') do (
  set "NEW_ZIP=%%F"
  goto :zip_found
)

echo No zip found matching "%ZIP_PREFIX%*.zip" in repo root. Aborting.
exit /b 1

:zip_found
echo Found: "%NEW_ZIP%"

echo.
echo ==========================
echo 4) Replace public\www.zip
echo ==========================
if exist "%TARGET_ZIP%" (
  del /f /q "%TARGET_ZIP%"
  if errorlevel 1 (
    echo Failed to delete "%TARGET_ZIP%". Aborting.
    exit /b 1
  )
)

move /y "%NEW_ZIP%" "%TARGET_ZIP%" >nul
if errorlevel 1 (
  echo Failed to move "%NEW_ZIP%" to "%TARGET_ZIP%". Aborting.
  exit /b 1
)
echo Replaced: "%TARGET_ZIP%"

echo.
echo ==========================
echo 5) Compute SHA256 (certutil)
echo ==========================
for /f "tokens=1" %%H in ('
  certutil -hashfile "%TARGET_ZIP%" SHA256 ^| findstr /r /i "^[0-9A-F][0-9A-F]*$"
') do (
  set "SHA=%%H"
  goto :sha_found
)

echo Failed to compute SHA256. Aborting.
exit /b 1

:sha_found
echo SHA256: !SHA!

echo.
echo.
echo ==========================
echo 6) Update manifest.json (checksum + version++)
echo ==========================

if not exist "%MANIFEST%" (
  echo Manifest not found: "%MANIFEST%". Aborting.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='%MANIFEST%';" ^
  "$j=Get-Content $p -Raw | ConvertFrom-Json;" ^
  "if($null -eq $j.checksum){ throw 'manifest.json missing top-level checksum'; }" ^
  "if($null -eq $j.version){ throw 'manifest.json missing top-level version'; }" ^
  "$j.checksum='!SHA!';" ^
  "$v=[string]$j.version;" ^
  "$m=[regex]::Match($v,'^(?<maj>\d+)(\.(?<min>\d+))?(\.(?<pat>\d+))?$');" ^
  "if($m.Success) {" ^
  "  $maj=[int]$m.Groups['maj'].Value;" ^
  "  $min=if($m.Groups['min'].Success){[int]$m.Groups['min'].Value}else{0};" ^
  "  $pat=if($m.Groups['pat'].Success){[int]$m.Groups['pat'].Value}else{0};" ^
  "  $pat++;" ^
  "  $j.version=($maj.ToString()+'.'+$min.ToString()+'.'+$pat.ToString());" ^
  "} else {" ^
  "  $m2=[regex]::Match($v,'\d+');" ^
  "  if(-not $m2.Success){ throw ('manifest.json version has no digits: ' + $v) }" ^
  "  $n=[int]$m2.Value + 1;" ^
  "  $j.version=([regex]::Replace($v,'\d+',$n.ToString(),1));" ^
  "}" ^
  "$j | ConvertTo-Json -Depth 50 | Set-Content -Encoding UTF8 $p;" ^
  "Write-Host ('Updated manifest.json => version=' + $j.version + ' checksum=' + $j.checksum);"
if errorlevel 1 (
  echo Failed to update "%MANIFEST%". Aborting.
  exit /b 1
)


echo.
echo ==========================
echo 7) firebase deploy
echo ==========================
call firebase deploy
if errorlevel 1 (
  echo Firebase deploy failed.
  exit /b 1
)

echo.
echo Done. Your humans can celebrate now.
exit /b 0
