# Guida Deploy su Fly.io - MotoStaffa Office

## Prerequisiti

1. Installa flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Login su Fly.io: `fly auth login`

## Passaggi per il Deploy

### 1. Crea il volume per i dati persistenti

Il database SQLite ha bisogno di un volume persistente:

```bash
fly volumes create data --region fra --size 1
```

### 2. Configura i secrets

Imposta le variabili d'ambiente necessarie:

```bash
# Chiave segreta per le sessioni (genera una stringa casuale lunga)
fly secrets set SESSION_SECRET="$(openssl rand -base64 32)"

# Credenziali admin
fly secrets set ADMIN_USERNAME=admin
fly secrets set ADMIN_PASSWORD_HASH='$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

# API Key per Google Maps (opzionale, per geocoding)
fly secrets set GOOGLE_MAPS_API_KEY="la-tua-api-key"

# API Key per AI (opzionale, per parsing AI)
fly secrets set OPENROUTER_API_KEY="la-tua-api-key"
```

La password hash di default corrisponde a: **motostaffa2024**

Per generare una nuova password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('tua-password', 10))"
```

### 3. Deploy dell'applicazione

```bash
fly deploy
```

### 4. Verifica il deploy

```bash
fly status
fly logs
```

Apri l'app nel browser:
```bash
fly open
```

## Comandi utili

```bash
# Vedere i log in tempo reale
fly logs -f

# SSH nella macchina
fly ssh console

# Riavviare l'app
fly apps restart management-staffe

# Eliminare e ricreare il volume (ATTENZIONE: perde i dati!)
fly volumes list
fly volumes delete <id>

# Aggiornare l'app dopo modifiche
fly deploy
```

## Risoluzione problemi

### Errore "volume is already attached"
Se hai problemi con il volume, potrebbe essere necessario:
```bash
fly machines list
fly machines destroy <id>
fly deploy
```

### Database non persistente
Verifica che il volume sia montato correttamente:
```bash
fly ssh console
ls -la /data
```

Dovresti vedere `database.sqlite` e `database.sqlite-wal`.

### App non risponde
Controlla i log:
```bash
fly logs
```

Verifica il health check:
```bash
curl https://<tuo-dominio>.fly.dev/health
```

## Struttura file modificati

- `package.json` - Aggiunta dipendenza `node-fetch`
- `Dockerfile` - Downgrade a Node.js 20.x per stabilità
- `fly.toml` - Aggiunto health check e configurazione env
- `index.js` - Fix import dinamico node-fetch

## Backup database

Per scaricare il database:
```bash
fly ssh console
# Dentro la console:
cat /data/database.sqlite | base64
# Copia l'output e decodificalo in locale
```

Oppure usa sftp (se configurato).
