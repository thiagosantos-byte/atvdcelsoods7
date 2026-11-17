@echo off
setlocal
cd /d "%~dp0"
title Energia Viva - ODS 7

echo ================================================
echo       ENERGIA VIVA - SIMULADOR ODS 7
echo ================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale a versao LTS em https://nodejs.org/ e execute este arquivo novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado. Reinstale o Node.js LTS.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias. Esta etapa exige internet e ocorre apenas na primeira vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias. Verifique a conexao e tente novamente.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando o sistema...
echo O navegador abrira no endereco local do Vite.
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.
call npm run dev -- --open
pause
