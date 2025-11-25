# Push zu GitHub Repository: https://github.com/nebulausername/Nebula.Supply.git
# Dieses Script führt die Befehle aus, die GitHub vorgeschlagen hat

Write-Host "=== Push zu GitHub: Nebula.Supply ===" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Git verfügbar ist
try {
    $gitVersion = git --version
    Write-Host "✓ Git gefunden: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git ist nicht installiert!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Bitte installiere Git zuerst:" -ForegroundColor Yellow
    Write-Host "Download: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Nach der Installation PowerShell neu starten und dieses Script erneut ausführen." -ForegroundColor Yellow
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

# Prüfe ob Remote bereits existiert
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "Remote bereits konfiguriert: $existingRemote" -ForegroundColor Yellow
    $changeRemote = Read-Host "Möchtest du die Remote URL ändern? (j/n)"
    if ($changeRemote -eq "j" -or $changeRemote -eq "J") {
        git remote set-url origin https://github.com/nebulausername/Nebula.Supply.git
        Write-Host "✓ Remote URL aktualisiert" -ForegroundColor Green
    }
} else {
    Write-Host "Füge GitHub Remote hinzu..." -ForegroundColor Yellow
    git remote add origin https://github.com/nebulausername/Nebula.Supply.git
    Write-Host "✓ Remote hinzugefügt" -ForegroundColor Green
}

Write-Host ""

# Zeige aktuellen Status
Write-Host "Aktueller Git Status:" -ForegroundColor Cyan
git status --short

Write-Host ""

# Frage ob alle Dateien hinzugefügt werden sollen
$addFiles = Read-Host "Möchtest du alle Dateien hinzufügen und committen? (j/n)"
if ($addFiles -eq "j" -or $addFiles -eq "J" -or $addFiles -eq "y" -or $addFiles -eq "Y") {
    
    Write-Host ""
    Write-Host "Füge alle Dateien hinzu..." -ForegroundColor Yellow
    git add .
    Write-Host "✓ Dateien hinzugefügt" -ForegroundColor Green
    
    Write-Host ""
    $commitMessage = Read-Host "Commit Nachricht (oder Enter für 'Initial commit')"
    if (-not $commitMessage) {
        $commitMessage = "Initial commit"
    }
    
    Write-Host ""
    Write-Host "Erstelle Commit..." -ForegroundColor Yellow
    git commit -m $commitMessage
    Write-Host "✓ Commit erstellt" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Benenne Branch zu 'main' um..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✓ Branch umbenannt" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Pushe zu GitHub..." -ForegroundColor Yellow
    Write-Host "Hinweis: Du wirst nach deinen GitHub Credentials gefragt." -ForegroundColor Yellow
    Write-Host "Username: nebulausername" -ForegroundColor Cyan
    Write-Host "Password: Verwende ein Personal Access Token (nicht dein Passwort!)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Falls du noch kein Token hast:" -ForegroundColor Yellow
    Write-Host "1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)" -ForegroundColor Gray
    Write-Host "2. Generate new token (classic)" -ForegroundColor Gray
    Write-Host "3. Scopes: 'repo' auswählen" -ForegroundColor Gray
    Write-Host "4. Token generieren und kopieren" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Bereit zum Pushen? (j/n)"
    if ($continue -eq "j" -or $continue -eq "J" -or $continue -eq "y" -or $continue -eq "Y") {
        git push -u origin main
        Write-Host ""
        Write-Host "✓ Code erfolgreich zu GitHub gepusht!" -ForegroundColor Green
        Write-Host "Repository: https://github.com/nebulausername/Nebula.Supply" -ForegroundColor Cyan
    } else {
        Write-Host "Push abgebrochen. Du kannst später 'git push -u origin main' ausführen." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Du kannst die Befehle manuell ausführen:" -ForegroundColor Cyan
    Write-Host "  git add ." -ForegroundColor Gray
    Write-Host "  git commit -m 'Initial commit'" -ForegroundColor Gray
    Write-Host "  git branch -M main" -ForegroundColor Gray
    Write-Host "  git push -u origin main" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Fertig ===" -ForegroundColor Cyan


