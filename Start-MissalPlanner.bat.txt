@echo off
setlocal enabledelayedexpansion

rem ================================
rem  SPLASH SCREEN
rem ================================
echo.
echo =====================================
echo ===   Missal Planner – iniciando   ===
echo =====================================
echo.
echo Aguarde: verificando Node, NPM e servidor...
echo.

rem ================================
rem  DETECTAR NODE AUTOMATICAMENTE
rem ================================
set NODE_PATH=""
if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_PATH="C:\Program Files\nodejs\node.exe"
)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    set NODE_PATH="C:\Program Files (x86)\nodejs\node.exe"
)
if exist "%USERPROFILE%\AppData\Roaming\npm\node.exe" (
    set NODE_PATH="%USERPROFILE%\AppData\Roaming\npm\node.exe"
)

if %NODE_PATH%=="" (
    echo ERRO: Node.js não encontrado!
    echo Instale pelo site: https://nodejs.org
    pause
    exit /b
)

echo Node detectado em: %NODE_PATH%
echo.

rem ================================
rem  LOGS
rem ================================
set LOGFILE="logs\missal-start-log_%date:/=-%_%time::=-%.txt"
if not exist logs mkdir logs

echo ======== LOG MISSAL PLANNER ======== > %LOGFILE%
echo Iniciado em %date% %time% >> %LOGFILE%
echo Node detectado em: %NODE_PATH% >> %LOGFILE%

rem ================================
rem  INICIAR BACKEND (porta 3001)
rem ================================
echo Iniciando servidor de liturgia (porta 3001)...
start "Servidor Liturgia" cmd /c %NODE_PATH% server.js >> %LOGFILE% 2>&1

rem ================================
rem  AGUARDAR SERVIDOR
rem ================================
echo Aguardando servidor iniciar...
timeout /t 2 >nul

rem ================================
rem  INICIAR FRONTEND (Vite)
rem ================================
echo Iniciando interface Missal Planner...
start "Missal Planner" cmd /c npm run dev >> %LOGFILE% 2>&1

rem ================================
rem  ABRIR NO NAVEGADOR
rem ================================
timeout /t 3 >nul
start "" http://localhost:5173

rem ================================
rem  RODAR ÍCONE PERSONALIZADO VIA VBS
rem ================================
cscript //nologo Start-MissalPlanner.vbs

echo.
echo Missal Planner iniciado!
echo.
pause
