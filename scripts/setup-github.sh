#!/bin/bash

# Script per caricare MotoStaffa Office su GitHub
# Uso: ./scripts/setup-github.sh

echo "🚀 MotoStaffa Office - Setup GitHub"
echo "===================================="
echo ""

# Verifica che sia nella cartella corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Devi eseguire questo script dalla cartella motostaffa-office"
    exit 1
fi

# Chiedi il nome utente GitHub
read -p "Inserisci il tuo username GitHub: " GITHUB_USER

# Chiedi il nome del repository
read -p "Inserisci il nome del repository (default: motostaffa-office): " REPO_NAME
REPO_NAME=${REPO_NAME:-motostaffa-office}

echo ""
echo "📦 Configurazione repository..."

# Inizializza git
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Initial commit: MotoStaffa Office"

# Aggiungi remote
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

echo ""
echo "📤 Push su GitHub..."

# Push
git branch -M main
git push -u origin main

echo ""
echo "✅ Completato!"
echo ""
echo "🔗 Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "📋 Prossimi passi:"
echo "1. Vai su https://render.com"
echo "2. Clicca 'New' → 'Blueprint'"
echo "3. Collega il repository GitHub"
echo "4. Configura la password in ADMIN_PASSWORD_HASH"
echo ""