@echo off

:: Get the absolute path of the script's directory
set SCRIPT_DIR=%~dp0

:: Get the absolute path of the current project directory
set PROJECT_DIR=%SCRIPT_DIR%..

:: Navigate to the target directory
cd %USERPROFILE%\.node-red

:: Initialize a package.json if it doesn't exist
if not exist "package.json" (
  npm init -y
)

:: Install the project as a dependency
::echo %PROJECT_DIR%
npm install --save %PROJECT_DIR%

echo Installation completed.
