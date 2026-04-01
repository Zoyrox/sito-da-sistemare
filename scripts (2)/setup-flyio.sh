#!/bin/bash
# Script di setup automatico per Fly.io

set -e

echo "🚀 Setup MotoStaffa Office su Fly.io"
echo "===================================="

# Verifica che flyctl sia installato
if ! command -v fly &> /dev/null; then
    echo "❌ flyctl non trovato. Installalo da: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Verifica login
if ! fly auth whoami &> /dev/null; then
    echo "🔑 Devi effettuare il login su Fly.io"
    fly auth login
fi

echo ""
echo "📋 Configurazione app: management-staffe"
echo ""

# Chiedi conferma per creare il volume
read -p "Vuoi creare il volume 'data' per il database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Creazione volume..."
    fly volumes create data --region fra --size 1 || echo "⚠️ Volume potrebbe già esistere"
fi

echo ""
echo "🔐 Configurazione secrets..."

# Genera session secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET generato"
fly secrets set SESSION_SECRET="$SESSION_SECRET"

# Admin credentials
read -p "Username admin [admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}
fly secrets set ADMIN_USERNAME="$ADMIN_USER"

# Password
read -s -p "Password admin [motostaffa2024]: " ADMIN_PASS
echo
ADMIN_PASS=${ADMIN_PASS:-motostaffa2024}
ADMIN_HASH=$(node -e "console.log(require('bcryptjs').hashSync('$ADMIN_PASS', 10))")
fly secrets set ADMIN_PASSWORD_HASH="$ADMIN_HASH"

echo ""
read -p "Google Maps API Key (opzionale, premi invio per saltare): " GMAP_KEY
if [ ! -z "$GMAP_KEY" ]; then
    fly secrets set GOOGLE_MAPS_API_KEY="$GMAP_KEY"
fi

read -p "OpenRouter API Key (opzionale, premi invio per saltare): " OPENROUTER_KEY
if [ ! -z "$OPENROUTER_KEY" ]; then
    fly secrets set OPENROUTER_API_KEY="$OPENROUTER_KEY"
fi

echo ""
echo "🚀 Deploy in corso..."
fly deploy

echo ""
echo "✅ Deploy completato!"
echo ""
fly status

echo ""
echo "🌐 URL dell'app:"
fly open
