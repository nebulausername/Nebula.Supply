#!/bin/bash

echo "🚀 Starting Nebula Supply System..."
echo

echo "📦 Installing dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi

echo
echo "🚀 Starting all services..."
echo
echo "🌐 Web App: http://localhost:5173"
echo "🤖 Bot: Check Telegram"
echo "📊 Admin: http://localhost:5273"
echo

pnpm dev



