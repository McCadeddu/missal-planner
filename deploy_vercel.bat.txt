@echo off
echo ==========================================
echo        Missal-Planner — Deploy Vercel
echo ==========================================
echo.

set /p CONFIRMA="Enviar nova versão para producao? (S/N): "

if /I "%CONFIRMA%"=="S" (
    echo.
    echo ➤ Iniciando deploy...
    echo.
    vercel --prod

    echo.
    echo ➤ Deploy concluido!
    echo Abrindo o app no navegador...

    start https://missal-planner.vercel.app/
    echo.
    pause
    exit
)

echo Deploy cancelado.
pause
