#!/bin/bash
# Nebula Admin Dashboard - Environment Setup Script
# Dieses Script erstellt automatisch die .env.local Datei

echo "📝 Erstelle .env.local für Admin Dashboard..."

cat > apps/admin/.env.local << 'EOF'
# Nebula Admin Dashboard - Local Environment Configuration

# API Server URL
VITE_API_URL=http://localhost:3001

# WebSocket Server URL (usually same as API)
VITE_WS_URL=http://localhost:3001

# Enable debug logging
VITE_DEBUG=true

# Environment
VITE_ENV=development
EOF

if [ -f "apps/admin/.env.local" ]; then
    echo "✅ .env.local erfolgreich erstellt!"
    echo ""
    echo "Inhalt:"
    cat apps/admin/.env.local
    echo ""
    echo "🚀 Du kannst jetzt das Admin Dashboard starten mit:"
    echo "   pnpm dev:admin:full"
else
    echo "❌ Fehler beim Erstellen der .env.local Datei"
fi

