@echo off
title Sistema de Gestion Municipal
color 0f
cls

echo ==================================================
echo   INICIANDO SISTEMA DE GESTION MUNICIPAL
echo ==================================================
echo.

:: 1. Verify Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor instale Node.js desde https://nodejs.org/
    pause
    exit
)

:: 2. Check Dependencies
if not exist "node_modules" (
    echo [INFO] Instalando dependencias necesarias...
    echo Esto solo se hace la primera vez. Puede tardar un minuto.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Fallo la instalacion de paquetes. Revise su conexion.
        pause
        exit
    )
)

:: 3. Launch Server
echo.
echo [EXITO] Sistema listo.
echo Abriendo aplicacion en el navegador...
echo.
echo    --- PRECAUCION: NO CIERRE ESTA VENTANA ---
echo.

:: Open Browser
start http://localhost:3000

:: Start Server
node server.js
pause
