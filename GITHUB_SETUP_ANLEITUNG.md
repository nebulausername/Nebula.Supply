# GitHub Setup Anleitung für NebulaCodex

## Schritt 1: Git installieren (falls noch nicht installiert)

1. Git herunterladen: https://git-scm.com/download/win
2. Installer ausführen und Git installieren
3. Nach der Installation PowerShell/Terminal neu starten

## Schritt 2: Git konfigurieren (einmalig)

```powershell
git config --global user.name "Dein Name"
git config --global user.email "deine.email@example.com"
```

## Schritt 3: GitHub Repository erstellen

1. Gehe zu https://github.com
2. Klicke auf das "+" Symbol oben rechts → "New repository"
3. Repository Name: z.B. "NebulaCodex"
4. Wähle "Private" oder "Public"
5. **WICHTIG**: Lasse "Initialize this repository with a README" **NICHT** angehakt
6. Klicke auf "Create repository"

## Schritt 4: Lokales Git Repository initialisieren

Führe diese Befehle im Projektordner aus:

```powershell
# In den Projektordner wechseln
cd "C:\Users\dariu\Desktop\Websites made by Darius Hofman\NebulaCodex-main"

# Git Repository initialisieren
git init

# Alle Dateien zum Staging hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initial commit: NebulaCodex Projekt"

# GitHub Repository als Remote hinzufügen
# Ersetze USERNAME und REPOSITORY_NAME mit deinen Werten
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git

# Branch auf 'main' umbenennen (falls nötig)
git branch -M main

# Code zu GitHub pushen
git push -u origin main
```

## Schritt 5: Authentifizierung

Beim ersten Push wirst du nach deinen GitHub-Credentials gefragt:
- **Username**: Dein GitHub Benutzername
- **Password**: Verwende ein **Personal Access Token** (nicht dein Passwort!)

### Personal Access Token erstellen:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)"
3. Name: z.B. "NebulaCodex"
4. Scopes: `repo` auswählen
5. "Generate token" klicken
6. **Token kopieren und sicher aufbewahren** (wird nur einmal angezeigt!)

## Alternative: GitHub Desktop verwenden

Falls die Kommandozeile zu kompliziert ist:
1. GitHub Desktop herunterladen: https://desktop.github.com/
2. Mit GitHub Account anmelden
3. File → Add Local Repository
4. Projektordner auswählen
5. "Publish repository" klicken

## Wichtige Dateien die bereits ignoriert werden (.gitignore)

Die folgenden Dateien/Ordner werden automatisch ignoriert:
- `node_modules/`
- `.env` (Umgebungsvariablen - NICHT auf GitHub hochladen!)
- `dist/`, `build/`
- `.DS_Store`
- `pnpm-lock.yaml`

## Nach dem ersten Push: Updates hochladen

Wenn du Änderungen gemacht hast:

```powershell
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

## Hilfe bei Problemen

Falls Git-Befehle nicht funktionieren:
- PowerShell als Administrator starten
- Git Installation überprüfen: `git --version`
- PATH-Variable überprüfen


