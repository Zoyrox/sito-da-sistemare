@echo off
chcp 65001 >nul
cls

echo 🚀 MotoStaffa Office - Setup GitHub
echo ====================================
echo.

REM Verifica che sia nella cartella corretta
if not exist "package.json" (
    echo ❌ Errore: Devi eseguire questo script dalla cartella motostaffa-office
    pause
    exit /b 1
)

set /p GITHUB_USER="Inserisci il tuo username GitHub: "
set /p REPO_NAME="Inserisci il nome del repository (default: motostaffa-office): "
if "%REPO_NAME%"=="" set REPO_NAME=motostaffa-office

echo.
echo 📦 Configurazione repository...

REM Inizializza git
git init

REM Aggiungi tutti i file
git add .

REM Primo commit
git commit -m "Initial commit: MotoStaffa Office"

REM Aggiungi remote
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git

echo.
echo 📤 Push su GitHub...

REM Push
git branch -M main
git push -u origin main

echo.
echo ✅ Completato!
echo.
echo 🔗 Repository: https://github.com/%GITHUB_USER%/%REPO_NAME%
echo.
echo 📋 Prossimi passi:
echo 1. Vai su https://render.com
echo 2. Clicca 'New' → 'Blueprint'
echo 3. Collega il repository GitHub
echo 4. Configura la password in ADMIN_PASSWORD_HASH
echo.

pause