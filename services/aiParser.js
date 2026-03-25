// services/aiParser.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inizializza il client Gemini con la tua chiave API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Lista di modelli gratuiti da tentare in ordine di preferenza
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest'
];

// Helper per chiamata chat con Gemini con fallback automatico
async function geminiChat(prompt) {
  let lastError = null;

  for (const modelName of MODELS) {
    try {
      console.log(`Tentativo con modello: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log(`✅ Modello ${modelName} funzionante`);
      return text;
    } catch (err) {
      console.warn(`❌ Modello ${modelName} fallito:`, err.message);
      lastError = err;
      // Continua con il prossimo modello
    }
  }

  // Se tutti i modelli hanno fallito, lancia l'ultimo errore
  throw new Error(`Nessun modello disponibile. Ultimo errore: ${lastError?.message}`);
}

async function parseCustomerData(text) {
  try {
    const prompt = `
Estrai i dati cliente dal testo, se manca qualcosa ma riesci a reperirlo, fallo. Es. sai la città ma non sai il cap? lo aggiungi tu, vale anche per il resto ma non inventarti nulla.
Rispondi SOLO in JSON valido:
{
  "customer_name": "nome completo o null",
  "customer_phone": "numero con prefisso internazionale o null",
  "customer_email": "email o null",
  "customer_address": "indirizzo completo o null",
  "customer_city": "città o null",
  "customer_zip": "CAP o codice postale o null",
  "customer_province": "provincia/stato o null",
  "country": "paese rilevato o null",
  "confidence": "high/medium/low"
}

Testo:
${text}
    `;

    const aiResult = await geminiChat(prompt);
    const match = aiResult.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON non trovato');
    return JSON.parse(match[0]);

  } catch (err) {
    console.error('Gemini AI Error:', err.message);
    return null;
  }
}

module.exports = { parseCustomerData };