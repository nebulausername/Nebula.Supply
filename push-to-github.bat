@echo off
echo ========================================
echo Push zu GitHub: Nebula.Supply
echo ========================================
echo.

REM Prüfe ob Git verfügbar ist
git --version >nul 2>&1
if errorlevel 1 (
    echo FEHLER: Git ist nicht installiert!
    echo.
    echo Bitte installiere Git zuerst:
    echo Download: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo Git gefunden!
echo.

REM Prüfe ob bereits ein Git Repository existiert
if not exist .git (
    echo Initialisiere Git Repository...
    git init
    echo.
)

REM Prüfe ob Remote bereits existiert
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Fuege GitHub Remote hinzu...
    git remote add origin https://github.com/nebulausername/Nebula.Supply.git
    echo Remote hinzugefuegt!
) else (
    echo Remote bereits konfiguriert.
    git remote set-url origin https://github.com/nebulausername/Nebula.Supply.git
    echo Remote URL aktualisiert!
)

echo.
echo ========================================
echo Fuege alle Dateien hinzu...
echo ========================================
git add .

echo.
echo ========================================
echo Erstelle Commit...
echo ========================================
git commit -m "Initial commit"

echo.
echo ========================================
echo Benenne Branch zu 'main' um...
echo ========================================
git branch -M main

echo.
echo ========================================
echo Pushe zu GitHub...
echo ========================================
echo.
echo WICHTIG: Du wirst nach deinen GitHub Credentials gefragt:
echo   Username: nebulausername
echo   Password: Verwende ein Personal Access Token (nicht dein Passwort!)
echo.
echo Falls du noch kein Token hast:
echo   1. GitHub -^> Settings -^> Developer settings -^> Personal access tokens
echo   2. Generate new token (classic)
echo   3. Scopes: 'repo' auswaehlen
echo   4. Token generieren und kopieren
echo.
pause

git push -u origin main

echo.
echo ========================================
echo Fertig!
echo Repository: https://github.com/nebulausername/Nebula.Supply
echo ========================================
pause


