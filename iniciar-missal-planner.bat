@echo off
title Missal Planner - Boot

echo Iniciando servidor backend...
start cmd /k "cd /d C:\projetos\missal-planner && node server.js"

timeout /t 2 >nul

echo Iniciando frontend (Vite)...
start cmd /k "cd /d C:\projetos\missal-planner && npm run dev"

timeout /t 3 >nul

echo Abrindo navegador...
start http://localhost:5173

echo Missal Planner iniciado!
pause
