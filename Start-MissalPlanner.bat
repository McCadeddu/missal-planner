@echo off
title Missal Planner - Inicializando
setlocal enabledelayedexpansion

echo =====================================
echo ===      Missal Planner v0.0.4     ===
echo =====================================
echo.

rem ================================
rem  DETECTAR NODE AUTOMATICAMENTE
rem ================================
set NODE_PATH=""

if exist "C:\Program Files\nodejs\node.exe" set NODE_PATH="C:\Program Files\nodejs\node.exe"
if exist "C:\Program Files (x86)\nodejs\node.exe" set NODE_PATH="C:\Program Files (x86)\nodejs\node.exe"
if exist "%USERPROFILE%\AppData\Roaming\npm\node.exe" set NODE_PATH="%USERPROFILE%\AppData\Roaming\npm\node.exe"

if %NODE_PATH%=="" (
    echo ERRO: Node.js não encontrado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b
)

echo Node detectado em: %NODE_PATH%
echo.

rem ================================
rem  INICIAR FRONTEND (Vite)
rem ================================
echo Iniciando interface (Vite)...
start "VITE" cmd /c npm run dev

rem Esperar Vite subir (5173)
echo Aguardando Vite iniciar...
timeout /t 3 >nul

rem ================================
rem  INICIAR ELECTRON
rem ================================
echo Iniciando Electron...
start "ELECTRON" cmd /c npm run electron

echo.
echo Missal Planner iniciado com sucesso!
echo.
exit
