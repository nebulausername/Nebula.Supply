#!/bin/bash
# Nebula Admin Dashboard - Quick Start Script
# Startet automatisch API Server + Admin Dashboard

echo ""
echo "========================================"
echo "  Nebula Admin Dashboard - Quick Start"
echo "========================================"
echo ""

# Prüfe ob .env.local existiert
if [ ! -f "apps/admin/.env.local" ]; then
    echo "[!] .env.local nicht gefunden - erstelle..."
    bash setup-admin-env.sh
    echo ""
fi

echo "[+] Starte API Server und Admin Dashboard..."
echo ""
echo "    API Server:    http://localhost:3001"
echo "    Admin Panel:   http://localhost:5273"
echo ""
echo "    Login:         admin@nebula.local / admin123"
echo ""
echo "========================================"
echo ""

# Starte beide Server gleichzeitig
pnpm dev:admin:full

