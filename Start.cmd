@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Install Node.js LTS from https://nodejs.org/ & pause & exit /b 1)
node tools\check-resources.mjs
if errorlevel 1 (pause & exit /b 1)
start "" http://127.0.0.1:4889/offline/index.html
node tools\serve.mjs
pause
