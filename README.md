# MotoStaffa Office v2.0

**Order Management System** per venditore singolo di accessori moto.

![Version](https://img.shields.io/badge/version-2.0.0-orange)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Caratteristiche

- **Design Moderno**: Interfaccia dark con accenti arancioni, angoli arrotondati, ombre morbide
- **Smart Paste**: Incolla testo da chat/messaggi e estrae automaticamente nome, telefono, indirizzo, CAP
- **Database SQLite**: Persistenza dati garantita, anche su Render.com con disco persistente
- **Autenticazione Sicura**: Sessioni con bcrypt per la password
- **Gestione Completa**: Ordini, clienti, etichette di spedizione, tracking
- **Responsive**: Funziona su desktop, tablet e mobile
- **Stampa Etichette**: Formato ottimizzato per stampanti termiche

## Requisiti

- Node.js >= 18.0.0
- npm o yarn

## Installazione Locale

```bash
# 1. Estrai l'archivio
tar -xzf motostaffa-office.tar.gz
cd motostaffa-office

# 2. Installa dipendenze
npm install

# 3. Configura ambiente
cp .env.example .env
# Modifica .env con le tue impostazioni

# 4. Avvia il server
npm start

# 5. Accedi
URL: http://localhost:3000
Username: admin
Password: motostaffa2024
```

## Deploy su Render.com

### Metodo 1: Blueprint (Consigliato)

1. Carica il codice su GitHub
2. Su Render, clicca "New +" → "Blueprint"
3. Collega il repository
4. Render leggerà automaticamente `render.yaml`
5. Il disco persistente verrà creato automaticamente

### Metodo 2: Manuale

1. Crea un nuovo **Web Service**
2. Collega il repository o carica lo zip
3. Imposta:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Aggiungi **Disk**:
   - Name: `motostaffa-data`
   - Mount Path: `/data`
   - Size: 1 GB
5. Imposta le variabili d'ambiente:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: (genera una stringa casuale)
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD_HASH`: (hash bcrypt della password)
   - `RENDER_DISK_PATH`: `/data`

## Struttura Database

### Tabelle

- **orders**: Ordini con dati cliente, prodotti, stato, tracking
- **customers**: Anagrafica clienti con storico ordini
- **products**: Catalogo prodotti con prezzi e disponibilità

### Backup

Il database SQLite è un singolo file:
- **Locale**: `./data/database.sqlite`
- **Render**: `/data/database.sqlite`

Per fare backup, scarica semplicemente il file.

## Smart Paste

Nella pagina "Nuovo Ordine", incolla il testo copiato da WhatsApp/email nel campo "Smart Paste". Il sistema estrae automaticamente:

- **Telefono**: Riconosce numeri italiani (+39, 0039, 3xx...)
- **CAP**: Codice postale a 5 cifre
- **Indirizzo**: Via, Viale, Piazza, Corso, Strada, ecc.
- **Città**: Dopo il CAP o nell'indirizzo

### Esempio

```
Ciao, sono Marco Rossi
Vorrei ordinare uno staffa per BMW
Il mio numero è 333 123 4567
Spedisci in Via Roma 15, 00100 Roma
```

Il sistema estrarrà:
- Nome: Marco Rossi
- Telefono: +393331234567
- Indirizzo: Via Roma 15
- CAP: 00100
- Città: Roma

## Personalizzazione

### Colori

Modifica `public/css/style.css`:

```css
:root {
  --primary: #f97316;        /* Arancione principale */
  --primary-dark: #ea580c;   /* Arancione scuro */
  --bg-dark: #0f0f0f;        /* Sfondo scuro */
  --bg-card: #1a1a1a;        /* Sfondo card */
  /* ... */
}
```

### Logo

Sostituisci `public/img/logo.svg` con il tuo logo.

## Troubleshooting

### Il database si resetta

- Verifica che `RENDER_DISK_PATH=/data` sia impostato
- Controlla che il Disk sia montato correttamente su Render
- In locale, assicurati che la cartella `data/` esista e sia scrivibile

### Smart Paste non funziona

- Verifica che il testo contenga parole chiave italiane (Via, Viale, ecc.)
- Il numero di telefono deve iniziare con 3
- Il CAP deve essere esattamente 5 cifre

### Errori di autenticazione

- Cancella i cookie del browser
- Verifica `SESSION_SECRET` sia impostato
- Riavvia il server

## Supporto

Per problemi o domande, contatta lo sviluppatore.

## Changelog

### v2.0.0
- Design completamente rinnovato con angoli arrotondati
- Smart Paste migliorato per indirizzi italiani
- Database SQLite con persistenza garantita
- Supporto completo per Render.com
- Tema dark con accenti arancioni

---

**MotoStaffa Office** - Gestione ordini semplice ed efficace.
