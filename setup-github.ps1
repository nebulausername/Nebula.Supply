# GitHub Setup Script für NebulaCodex
# Dieses Script hilft beim Einrichten von Git und GitHub

Write-Host "=== NebulaCodex GitHub Setup ===" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Git installiert ist
try {
    $gitVersion = git --version
    Write-Host "✓ Git gefunden: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git ist nicht installiert oder nicht im PATH!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bitte installiere Git zuerst:" -ForegroundColor Yellow
    Write-Host "1. Gehe zu: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "2. Installiere Git" -ForegroundColor Yellow
    Write-Host "3. Starte PowerShell neu" -ForegroundColor Yellow
    Write-Host "4. Führe dieses Script erneut aus" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Prüfe ob bereits ein Git Repository existiert
if (Test-Path .git) {
    Write-Host "✓ Git Repository bereits initialisiert" -ForegroundColor Green
} else {
    Write-Host "Initialisiere Git Repository..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git Repository initialisiert" -ForegroundColor Green
}

Write-Host ""

# Prüfe Git Konfiguration
Write-Host "Aktuelle Git Konfiguration:" -ForegroundColor Cyan
$userName = git config user.name
$userEmail = git config user.email

if ($userName) {
    Write-Host "  Name: $userName" -ForegroundColor Green
} else {
    Write-Host "  Name: NICHT GESETZT" -ForegroundColor Red
    $name = Read-Host "Bitte gib deinen Namen ein"
    git config --global user.name $name
}

if ($userEmail) {
    Write-Host "  Email: $userEmail" -ForegroundColor Green
} else {
    Write-Host "  Email: NICHT GESETZT" -ForegroundColor Red
    $email = Read-Host "Bitte gib deine Email ein"
    git config --global user.email $email
}

Write-Host ""

# Prüfe ob Remote bereits konfiguriert ist
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "✓ Remote bereits konfiguriert: $remote" -ForegroundColor Green
} else {
    Write-Host "GitHub Remote Repository:" -ForegroundColor Cyan
    Write-Host "1. Erstelle ein neues Repository auf GitHub (https://github.com/new)" -ForegroundColor Yellow
    Write-Host "2. Kopiere die Repository URL (z.B. https://github.com/USERNAME/REPOSITORY.git)" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "Gib die GitHub Repository URL ein (oder Enter zum Überspringen)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✓ Remote hinzugefügt: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠ Remote nicht hinzugefügt. Du kannst es später mit 'git remote add origin URL' hinzufügen." -ForegroundColor Yellow
    }
}

Write-Host ""

# Zeige Status
Write-Host "Git Status:" -ForegroundColor Cyan
git status --short

Write-Host ""

# Frage ob Commit erstellt werden soll
$createCommit = Read-Host "Möchtest du alle Änderungen committen? (j/n)"
if ($createCommit -eq "j" -or $createCommit -eq "J" -or $createCommit -eq "y" -or $createCommit -eq "Y") {
    $commitMessage = Read-Host "Commit Nachricht (oder Enter für 'Initial commit')"
    if (-not $commitMessage) {
        $commitMessage = "Initial commit: NebulaCodex Projekt"
    }
    
    Write-Host ""
    Write-Host "Füge Dateien hinzu..." -ForegroundColor Yellow
    git add .
    
    Write-Host "Erstelle Commit..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    Write-Host "✓ Commit erstellt!" -ForegroundColor Green
    Write-Host ""
    
    # Frage ob gepusht werden soll
    $push = Read-Host "Möchtest du zu GitHub pushen? (j/n)"
    if ($push -eq "j" -or $push -eq "J" -or $push -eq "y" -or $push -eq "Y") {
        Write-Host ""
        Write-Host "Pushe zu GitHub..." -ForegroundColor Yellow
        Write-Host "Hinweis: Du wirst nach deinen GitHub Credentials gefragt." -ForegroundColor Yellow
        Write-Host "Verwende ein Personal Access Token als Passwort!" -ForegroundColor Yellow
        Write-Host ""
        
        # Prüfe ob main branch existiert
        $branch = git branch --show-current
        if ($branch -ne "main" -and $branch -ne "master") {
            git branch -M main
        }
        
        git push -u origin main
        Write-Host "✓ Code zu GitHub gepusht!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Setup abgeschlossen ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nützliche Befehle für die Zukunft:" -ForegroundColor Cyan
Write-Host "  git add .                    - Alle Änderungen hinzufügen" -ForegroundColor Gray
Write-Host "  git commit -m 'Nachricht'    - Commit erstellen" -ForegroundColor Gray
Write-Host "  git push                     - Zu GitHub pushen" -ForegroundColor Gray
Write-Host "  git status                   - Status anzeigen" -ForegroundColor Gray


