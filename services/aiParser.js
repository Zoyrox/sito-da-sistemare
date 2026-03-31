// services/aiParser.js - AI Avanzata per MotoStaffa Office

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

// Mappa dei paesi con codici ISO per rilevamento automatico
// Formato: nome_paese: [nome_visualizzato, codice_iso]
const COUNTRY_MAP = {
  // Italia
  'italia': ['Italia', 'IT'], 'italy': ['Italia', 'IT'], 'it': ['Italia', 'IT'],
  // Svizzera
  'svizzera': ['Svizzera', 'CH'], 'switzerland': ['Svizzera', 'CH'], 'schweiz': ['Svizzera', 'CH'], 'ch': ['Svizzera', 'CH'],
  // San Marino
  'san marino': ['San Marino', 'SM'], 'sanmarino': ['San Marino', 'SM'], 'sm': ['San Marino', 'SM'],
  // Città del Vaticano
  'vaticano': ['Città del Vaticano', 'VA'], 'vatican': ['Città del Vaticano', 'VA'], 'va': ['Città del Vaticano', 'VA'],
  // Francia
  'francia': ['Francia', 'FR'], 'france': ['Francia', 'FR'], 'fr': ['Francia', 'FR'],
  // Germania
  'germania': ['Germania', 'DE'], 'germany': ['Germania', 'DE'], 'deutschland': ['Germania', 'DE'], 'de': ['Germania', 'DE'],
  // Austria
  'austria': ['Austria', 'AT'], 'österreich': ['Austria', 'AT'], 'at': ['Austria', 'AT'],
  // Slovenia
  'slovenia': ['Slovenia', 'SI'], 'slovenija': ['Slovenia', 'SI'], 'si': ['Slovenia', 'SI'],
  // Croazia
  'croazia': ['Croazia', 'HR'], 'croatia': ['Croazia', 'HR'], 'hr': ['Croazia', 'HR'],
  // Spagna
  'spagna': ['Spagna', 'ES'], 'spain': ['Spagna', 'ES'], 'españa': ['Spagna', 'ES'], 'es': ['Spagna', 'ES'],
  // Regno Unito
  'regno unito': ['Regno Unito', 'GB'], 'uk': ['Regno Unito', 'GB'], 'united kingdom': ['Regno Unito', 'GB'], 'gb': ['Regno Unito', 'GB'],
  // Belgio
  'belgio': ['Belgio', 'BE'], 'belgium': ['Belgio', 'BE'], 'belgië': ['Belgio', 'BE'], 'be': ['Belgio', 'BE'],
  // Olanda/Paesi Bassi
  'olanda': ['Paesi Bassi', 'NL'], 'olande': ['Paesi Bassi', 'NL'], 'paesi bassi': ['Paesi Bassi', 'NL'], 'netherlands': ['Paesi Bassi', 'NL'], 'nl': ['Paesi Bassi', 'NL'],
  // Lussemburgo
  'lussemburgo': ['Lussemburgo', 'LU'], 'luxembourg': ['Lussemburgo', 'LU'], 'lu': ['Lussemburgo', 'LU'],
  // Portogallo
  'portogallo': ['Portogallo', 'PT'], 'portugal': ['Portogallo', 'PT'], 'pt': ['Portogallo', 'PT'],
  // Polonia
  'polonia': ['Polonia', 'PL'], 'poland': ['Polonia', 'PL'], 'pl': ['Polonia', 'PL'],
  // Romania
  'romania': ['Romania', 'RO'], 'ro': ['Romania', 'RO'],
  // Bulgaria
  'bulgaria': ['Bulgaria', 'BG'], 'bg': ['Bulgaria', 'BG'],
  // Grecia
  'grecia': ['Grecia', 'GR'], 'greece': ['Grecia', 'GR'], 'gr': ['Grecia', 'GR'],
  // Ungheria
  'ungheria': ['Ungheria', 'HU'], 'hungary': ['Ungheria', 'HU'], 'hu': ['Ungheria', 'HU'],
  // Repubblica Ceca
  'repubblica ceca': ['Repubblica Ceca', 'CZ'], 'czech republic': ['Repubblica Ceca', 'CZ'], 'česká republika': ['Repubblica Ceca', 'CZ'], 'cz': ['Repubblica Ceca', 'CZ'],
  // Slovacchia
  'slovacchia': ['Slovacchia', 'SK'], 'slovakia': ['Slovacchia', 'SK'], 'sk': ['Slovacchia', 'SK'],
  // Danimarca
  'danimarca': ['Danimarca', 'DK'], 'denmark': ['Danimarca', 'DK'], 'dk': ['Danimarca', 'DK'],
  // Svezia
  'svezia': ['Svezia', 'SE'], 'sweden': ['Svezia', 'SE'], 'sverige': ['Svezia', 'SE'], 'se': ['Svezia', 'SE'],
  // Norvegia
  'norvegia': ['Norvegia', 'NO'], 'norway': ['Norvegia', 'NO'], 'no': ['Norvegia', 'NO'],
  // Finlandia
  'finlandia': ['Finlandia', 'FI'], 'finland': ['Finlandia', 'FI'], 'fi': ['Finlandia', 'FI'],
  // Irlanda
  'irlanda': ['Irlanda', 'IE'], 'ireland': ['Irlanda', 'IE'], 'ie': ['Irlanda', 'IE'],
  // Estonia
  'estonia': ['Estonia', 'EE'], 'ee': ['Estonia', 'EE'],
  // Lettonia
  'lettonia': ['Lettonia', 'LV'], 'latvia': ['Lettonia', 'LV'], 'lv': ['Lettonia', 'LV'],
  // Lituania
  'lituania': ['Lituania', 'LT'], 'lithuania': ['Lituania', 'LT'], 'lt': ['Lituania', 'LT'],
  // Malta
  'malta': ['Malta', 'MT'], 'mt': ['Malta', 'MT'],
  // Cipro
  'cipro': ['Cipro', 'CY'], 'cyprus': ['Cipro', 'CY'], 'cy': ['Cipro', 'CY'],
  // Stati Uniti
  'stati uniti': ['Stati Uniti', 'US'], 'stati uniti d america': ['Stati Uniti', 'US'], 'united states': ['Stati Uniti', 'US'], 'usa': ['Stati Uniti', 'US'], 'us': ['Stati Uniti', 'US'],
  // Canada
  'canada': ['Canada', 'CA'], 'ca': ['Canada', 'CA'],
  // Australia
  'australia': ['Australia', 'AU'], 'au': ['Australia', 'AU'],
  // Russia
  'russia': ['Russia', 'RU'], 'ru': ['Russia', 'RU'],
  // Ucraina
  'ucraina': ['Ucraina', 'UA'], 'ukraine': ['Ucraina', 'UA'], 'ua': ['Ucraina', 'UA'],
  // Turchia
  'turchia': ['Turchia', 'TR'], 'turkey': ['Turchia', 'TR'], 'tr': ['Turchia', 'TR'],
  // Giappone
  'giappone': ['Giappone', 'JP'], 'japan': ['Giappone', 'JP'], 'jp': ['Giappone', 'JP'],
  // Cina
  'cina': ['Cina', 'CN'], 'china': ['Cina', 'CN'], 'cn': ['Cina', 'CN'],
  // India
  'india': ['India', 'IN'], 'in': ['India', 'IN'],
  // Brasile
  'brasile': ['Brasile', 'BR'], 'brazil': ['Brasile', 'BR'], 'br': ['Brasile', 'BR'],
  // Argentina
  'argentina': ['Argentina', 'AR'], 'ar': ['Argentina', 'AR'],
  // Messico
  'messico': ['Messico', 'MX'], 'mexico': ['Messico', 'MX'], 'mx': ['Messico', 'MX'],
  // Sudafrica
  'sudafrica': ['Sudafrica', 'ZA'], 'south africa': ['Sudafrica', 'ZA'], 'za': ['Sudafrica', 'ZA'],
  // Emirati Arabi
  'emirati arabi': ['Emirati Arabi Uniti', 'AE'], 'emirati arabi uniti': ['Emirati Arabi Uniti', 'AE'], 'uae': ['Emirati Arabi Uniti', 'AE'], 'ae': ['Emirati Arabi Uniti', 'AE'],
  // Arabia Saudita
  'arabia saudita': ['Arabia Saudita', 'SA'], 'saudi arabia': ['Arabia Saudita', 'SA'], 'sa': ['Arabia Saudita', 'SA'],
  // Israele
  'israele': ['Israele', 'IL'], 'israel': ['Israele', 'IL'], 'il': ['Israele', 'IL'],
  // Corea del Sud
  'corea del sud': ['Corea del Sud', 'KR'], 'south korea': ['Corea del Sud', 'KR'], 'kr': ['Corea del Sud', 'KR'],
  // Thailandia
  'thailandia': ['Thailandia', 'TH'], 'thailand': ['Thailandia', 'TH'], 'th': ['Thailandia', 'TH'],
  // Singapore
  'singapore': ['Singapore', 'SG'], 'sg': ['Singapore', 'SG'],
  // Malesia
  'malesia': ['Malesia', 'MY'], 'malaysia': ['Malesia', 'MY'], 'my': ['Malesia', 'MY'],
  // Indonesia
  'indonesia': ['Indonesia', 'ID'], 'id': ['Indonesia', 'ID'],
  // Filippine
  'filippine': ['Filippine', 'PH'], 'philippines': ['Filippine', 'PH'], 'ph': ['Filippine', 'PH'],
  // Vietnam
  'vietnam': ['Vietnam', 'VN'], 'viet nam': ['Vietnam', 'VN'], 'vn': ['Vietnam', 'VN'],
  // Nuova Zelanda
  'nuova zelanda': ['Nuova Zelanda', 'NZ'], 'new zealand': ['Nuova Zelanda', 'NZ'], 'nz': ['Nuova Zelanda', 'NZ'],
  // Serbia
  'serbia': ['Serbia', 'RS'], 'rs': ['Serbia', 'RS'],
  // Montenegro
  'montenegro': ['Montenegro', 'ME'], 'me': ['Montenegro', 'ME'],
  // Macedonia
  'macedonia': ['Macedonia del Nord', 'MK'], 'north macedonia': ['Macedonia del Nord', 'MK'], 'mk': ['Macedonia del Nord', 'MK'],
  // Albania
  'albania': ['Albania', 'AL'], 'al': ['Albania', 'AL'],
  // Kosovo
  'kosovo': ['Kosovo', 'XK'], 'xk': ['Kosovo', 'XK'],
  // Bosnia
  'bosnia': ['Bosnia ed Erzegovina', 'BA'], 'bosnia ed erzegovina': ['Bosnia ed Erzegovina', 'BA'], 'ba': ['Bosnia ed Erzegovina', 'BA'],
  // Moldavia
  'moldavia': ['Moldavia', 'MD'], 'moldova': ['Moldavia', 'MD'], 'md': ['Moldavia', 'MD'],
  // Bielorussia
  'bielorussia': ['Bielorussia', 'BY'], 'belarus': ['Bielorussia', 'BY'], 'by': ['Bielorussia', 'BY'],
  // Islanda
  'islanda': ['Islanda', 'IS'], 'iceland': ['Islanda', 'IS'], 'is': ['Islanda', 'IS'],
  // Liechtenstein
  'liechtenstein': ['Liechtenstein', 'LI'], 'li': ['Liechtenstein', 'LI'],
  // Monaco
  'monaco': ['Monaco', 'MC'], 'mc': ['Monaco', 'MC'],
  // Andorra
  'andorra': ['Andorra', 'AD'], 'ad': ['Andorra', 'AD'],
  // Città del Vaticano (già presente)
  // Malta (già presente)
  // Cipro (già presente)
};

// Province italiane per rilevamento
const ITALIAN_PROVINCES = {
  'ag': 'Agrigento', 'al': 'Alessandria', 'an': 'Ancona', 'ao': 'Aosta', 'ar': 'Arezzo', 'ap': 'Ascoli Piceno',
  'at': 'Asti', 'av': 'Avellino', 'ba': 'Bari', 'bt': 'Barletta-Andria-Trani', 'bl': 'Belluno', 'bn': 'Benevento',
  'bg': 'Bergamo', 'bi': 'Biella', 'bo': 'Bologna', 'bz': 'Bolzano', 'bs': 'Brescia', 'br': 'Brindisi',
  'ca': 'Cagliari', 'cl': 'Caltanissetta', 'cb': 'Campobasso', 'ci': 'Carbonia-Iglesias', 'ce': 'Caserta',
  'ct': 'Catania', 'cz': 'Catanzaro', 'ch': 'Chieti', 'co': 'Como', 'cs': 'Cosenza', 'cr': 'Cremona',
  'kr': 'Crotone', 'cn': 'Cuneo', 'en': 'Enna', 'fm': 'Fermo', 'fe': 'Ferrara', 'fi': 'Firenze',
  'fg': 'Foggia', 'fc': 'Forlì-Cesena', 'fr': 'Frosinone', 'ge': 'Genova', 'go': 'Gorizia', 'gr': 'Grosseto',
  'im': 'Imperia', 'is': 'Isernia', 'sp': 'La Spezia', 'aq': "L'Aquila", 'lt': 'Latina', 'le': 'Lecce',
  'lc': 'Lecco', 'li': 'Livorno', 'lo': 'Lodi', 'lu': 'Lucca', 'mc': 'Macerata', 'mn': 'Mantova',
  'ms': 'Massa-Carrara', 'mt': 'Matera', 'vs': 'Medio Campidano', 'me': 'Messina', 'mi': 'Milano',
  'mo': 'Modena', 'mb': 'Monza e Brianza', 'na': 'Napoli', 'no': 'Novara', 'nu': 'Nuoro', 'og': 'Ogliastra',
  'ot': 'Olbia-Tempio', 'or': 'Oristano', 'pd': 'Padova', 'pa': 'Palermo', 'pr': 'Parma', 'pv': 'Pavia',
  'pg': 'Perugia', 'pu': 'Pesaro e Urbino', 'pe': 'Pescara', 'pc': 'Piacenza', 'pi': 'Pisa', 'pt': 'Pistoia',
  'pn': 'Pordenone', 'pz': 'Potenza', 'po': 'Prato', 'rg': 'Ragusa', 'ra': 'Ravenna', 'rc': 'Reggio Calabria',
  're': 'Reggio Emilia', 'ri': 'Rieti', 'rn': 'Rimini', 'rm': 'Roma', 'ro': 'Rovigo', 'sa': 'Salerno',
  'ss': 'Sassari', 'sv': 'Savona', 'si': 'Siena', 'sr': 'Siracusa', 'so': 'Sondrio', 'ta': 'Taranto',
  'te': 'Teramo', 'tr': 'Terni', 'to': 'Torino', 'tp': 'Trapani', 'tn': 'Trento', 'tv': 'Treviso',
  'ts': 'Trieste', 'ud': 'Udine', 'va': 'Varese', 've': 'Venezia', 'vb': 'Verbano-Cusio-Ossola',
  'vc': 'Vercelli', 'vr': 'Verona', 'vv': 'Vibo Valentia', 'vi': 'Vicenza', 'vt': 'Viterbo'
};

// CAP esteri per rilevamento paese
const FOREIGN_ZIP_PATTERNS = {
  'Svizzera': /^[1-9]\d{3}$/,  // 4 cifre, non inizia con 0
  'San Marino': /^4789\d$/,     // inizia con 4789
  'Città del Vaticano': /^00120$/, // solo 00120
  'Francia': /^\d{5}$/,         // 5 cifre (attenzione: simile all'Italia)
  'Germania': /^\d{5}$/,        // 5 cifre
  'Austria': /^\d{4}$/,         // 4 cifre
  'Spagna': /^\d{5}$/,          // 5 cifre
  'Regno Unito': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, // Formato UK
  'Belgio': /^\d{4}$/,          // 4 cifre
  'Paesi Bassi': /^\d{4} ?[A-Z]{2}$/i, // 4 cifre + 2 lettere
  'Lussemburgo': /^\d{4}$/,     // 4 cifre
  'Portogallo': /^\d{4}-?\d{3}$/, // 4+3 cifre
  'Polonia': /^\d{2}-?\d{3}$/,  // 2+3 cifre
  'Romania': /^\d{6}$/,         // 6 cifre
  'Bulgaria': /^\d{4}$/,        // 4 cifre
  'Grecia': /^\d{3} ?\d{2}$/,   // 3+2 cifre
  'Ungheria': /^\d{4}$/,        // 4 cifre
  'Repubblica Ceca': /^\d{3} ?\d{2}$/, // 3+2 cifre
  'Slovacchia': /^\d{3} ?\d{2}$/, // 3+2 cifre
  'Danimarca': /^\d{4}$/,       // 4 cifre
  'Svezia': /^\d{3} ?\d{2}$/,   // 3+2 cifre
  'Norvegia': /^\d{4}$/,        // 4 cifre
  'Finlandia': /^\d{5}$/,       // 5 cifre
  'Irlanda': /^[A-Z]\d{2} ?[A-Z\d]{4}$/i, // Formato irlandese
};

// Mappa città -> Paese per rilevamento automatico
const CITY_TO_COUNTRY = {
  // Svizzera
  'zurigo': 'Svizzera', 'zürich': 'Svizzera', 'ginevra': 'Svizzera', 'geneva': 'Svizzera',
  'basilea': 'Svizzera', 'basel': 'Svizzera', 'berna': 'Svizzera', 'bern': 'Svizzera',
  'losanna': 'Svizzera', 'lausanne': 'Svizzera', 'lugano': 'Svizzera', 'winterthur': 'Svizzera',
  'lucerna': 'Svizzera', 'luzern': 'Svizzera', 'sankt gallen': 'Svizzera', 'st. gallen': 'Svizzera',
  // San Marino
  'san marino': 'San Marino', 'città di san marino': 'San Marino',
  // Città del Vaticano
  'vaticano': 'Città del Vaticano', 'città del vaticano': 'Città del Vaticano',
  // Francia
  'parigi': 'Francia', 'paris': 'Francia', 'lione': 'Francia', 'lyon': 'Francia',
  'marsiglia': 'Francia', 'marseille': 'Francia', 'nizza': 'Francia', 'nice': 'Francia',
  'tolosa': 'Francia', 'toulouse': 'Francia', 'nantes': 'Francia', 'strasburgo': 'Francia',
  'strasbourg': 'Francia', 'montpellier': 'Francia', 'bordeaux': 'Francia', 'lilla': 'Francia',
  'lille': 'Francia',
  // Germania
  'berlino': 'Germania', 'berlin': 'Germania', 'monaco': 'Germania', 'münchen': 'Germania',
  'munich': 'Germania', 'amburgo': 'Germania', 'hamburg': 'Germania', 'colonia': 'Germania',
  'köln': 'Germania', 'cologne': 'Germania', 'francoforte': 'Germania', 'frankfurt': 'Germania',
  'stoccarda': 'Germania', 'stuttgart': 'Germania', 'düsseldorf': 'Germania', 'dusseldorf': 'Germania',
  'dresda': 'Germania', 'dresden': 'Germania', 'lipsia': 'Germania', 'leipzig': 'Germania',
  // Austria
  'vienna': 'Austria', 'wienn': 'Austria', 'salisburgo': 'Austria', 'salzburg': 'Austria',
  'innsbruck': 'Austria', 'graz': 'Austria', 'linz': 'Austria',
  // Slovenia
  'lubiana': 'Slovenia', 'ljubljana': 'Slovenia', 'maribor': 'Slovenia',
  // Croazia
  'zagabria': 'Croazia', 'zagreb': 'Croazia', 'spalato': 'Croazia', 'split': 'Croazia',
  // Spagna
  'madrid': 'Spagna', 'barcellona': 'Spagna', 'barcelona': 'Spagna', 'valencia': 'Spagna',
  'siviglia': 'Spagna', 'sevilla': 'Spagna', 'malaga': 'Spagna', 'bilbao': 'Spagna',
  // UK
  'londra': 'Regno Unito', 'london': 'Regno Unito', 'manchester': 'Regno Unito',
  'birmingham': 'Regno Unito', 'liverpool': 'Regno Unito', 'edimburgo': 'Regno Unito',
  'edinburgh': 'Regno Unito', 'glasgow': 'Regno Unito',
  // Belgio
  'bruxelles': 'Belgio', 'brussels': 'Belgio', 'bruges': 'Belgio', 'anversa': 'Belgio',
  'antwerp': 'Belgio', 'gent': 'Belgio', 'gand': 'Belgio',
  // Olanda
  'amsterdam': 'Paesi Bassi', 'rotterdam': 'Paesi Bassi', 'l\'aia': 'Paesi Bassi',
  'den haag': 'Paesi Bassi', 'the hague': 'Paesi Bassi', 'utrecht': 'Paesi Bassi',
  // Lussemburgo
  'lussemburgo': 'Lussemburgo', 'luxembourg': 'Lussemburgo',
  // Portogallo
  'lisbona': 'Portogallo', 'lisbon': 'Portogallo', 'porto': 'Portogallo',
  // Polonia
  'varsavia': 'Polonia', 'warsaw': 'Polonia', 'cracovia': 'Polonia', 'krakow': 'Polonia',
  // Romania
  'bucarest': 'Romania', 'bucharest': 'Romania', 'cluj': 'Romania',
  // Bulgaria
  'sofia': 'Bulgaria',
  // Grecia
  'atenee': 'Grecia', 'athens': 'Grecia', 'salonicco': 'Grecia', 'thessaloniki': 'Grecia',
  // Ungheria
  'budapest': 'Ungheria',
  // Repubblica Ceca
  'praga': 'Repubblica Ceca', 'prague': 'Repubblica Ceca', 'brno': 'Repubblica Ceca',
  // Slovacchia
  'bratislava': 'Slovacchia',
  // Danimarca
  'copenaghen': 'Danimarca', 'copenhagen': 'Danimarca',
  // Svezia
  'stoccolma': 'Svezia', 'stockholm': 'Svezia', 'göteborg': 'Svezia', 'gothenburg': 'Svezia',
  // Norvegia
  'oslo': 'Norvegia', 'bergen': 'Norvegia',
  // Finlandia
  'helsinki': 'Finlandia',
  // Irlanda
  'dublino': 'Irlanda', 'dublin': 'Irlanda'
};

// Rileva il paese in base a vari fattori - restituisce formato "Nome (XX)"
function detectCountry(city, zip, province, text) {
  const textLower = text.toLowerCase();
  const cityLower = (city || '').toLowerCase();
  let countryResult = null;
  
  // 1. Cerca esplicitamente il nome del paese nel testo
  for (const [key, value] of Object.entries(COUNTRY_MAP)) {
    if (textLower.includes(key.toLowerCase())) {
      countryResult = value;
      break;
    }
  }
  
  // 2. Rileva dalla città
  if (!countryResult && cityLower && CITY_TO_COUNTRY[cityLower]) {
    const cityCountry = CITY_TO_COUNTRY[cityLower];
    // Trova il codice ISO corrispondente
    for (const [key, value] of Object.entries(COUNTRY_MAP)) {
      if (value[0] === cityCountry) {
        countryResult = value;
        break;
      }
    }
  }
  
  // 3. Rileva dal CAP
  if (!countryResult && zip) {
    const zipClean = zip.replace(/\s/g, '');
    
    // CAP italiani: 5 cifre che iniziano con 0-9 (range 00100-98100)
    if (/^\d{5}$/.test(zipClean)) {
      const zipNum = parseInt(zipClean);
      if (zipNum >= 1000 && zipNum <= 98100) {
        countryResult = ['Italia', 'IT'];
      }
    }
    
    // Verifica pattern esteri
    if (!countryResult) {
      for (const [countryName, pattern] of Object.entries(FOREIGN_ZIP_PATTERNS)) {
        if (pattern.test(zipClean)) {
          // Trova il codice ISO per questo paese
          for (const [key, value] of Object.entries(COUNTRY_MAP)) {
            if (value[0] === countryName) {
              countryResult = value;
              break;
            }
          }
          break;
        }
      }
    }
  }
  
  // 4. Rileva dalla provincia (solo province italiane)
  if (!countryResult && province) {
    const provLower = province.toLowerCase().replace(/[()]/g, '');
    if (ITALIAN_PROVINCES[provLower] || Object.values(ITALIAN_PROVINCES).some(p => p.toLowerCase() === provLower)) {
      countryResult = ['Italia', 'IT'];
    }
  }
  
  // Default: Italia
  if (!countryResult) {
    countryResult = ['Italia', 'IT'];
  }
  
  // Restituisci nel formato "Nome (XX)"
  return `${countryResult[0]} (${countryResult[1]})`;
}

// Rileva il tipo di staffa dal testo
function detectStaffaType(text) {
  const textLower = text.toLowerCase();
  
  // Pattern per carbonio
  const carbonioPatterns = [
    /\bcarbonio\b/i,
    /\bcarbon\b/i,
    /\bcarbone\b/i,
    /\bcarb\b/i,
    /staffa\s+car/i,
    /car\s+staffa/i
  ];
  
  // Pattern per alluminio
  const alluminioPatterns = [
    /\balluminio\b/i,
    /\baluminium\b/i,
    /\baluminum\b/i,
    /\ballum\b/i,
    /staffa\s+all/i,
    /all\s+staffa/i
  ];
  
  // Conta occorrenze
  let carbonioCount = 0;
  let alluminioCount = 0;
  
  for (const pattern of carbonioPatterns) {
    if (pattern.test(textLower)) carbonioCount++;
  }
  
  for (const pattern of alluminioPatterns) {
    if (pattern.test(textLower)) alluminioCount++;
  }
  
  if (carbonioCount > 0 && alluminioCount === 0) {
    return { type: 'carbonio', model: 'Staffa MV Agusta CARBONIO', confidence: 'high' };
  } else if (alluminioCount > 0 && carbonioCount === 0) {
    return { type: 'alluminio', model: 'Staffa MV Agusta ALLUMINIO', confidence: 'high' };
  } else if (carbonioCount > 0 && alluminioCount > 0) {
    // Entrambi menzionati, prendi il primo che appare
    const carbonioIndex = textLower.indexOf('carbonio');
    const alluminioIndex = textLower.indexOf('alluminio');
    if (carbonioIndex !== -1 && (alluminioIndex === -1 || carbonioIndex < alluminioIndex)) {
      return { type: 'carbonio', model: 'Staffa MV Agusta CARBONIO', confidence: 'medium' };
    } else {
      return { type: 'alluminio', model: 'Staffa MV Agusta ALLUMINIO', confidence: 'medium' };
    }
  }
  
  return null;
}

// Rileva la quantità dal testo
function detectQuantity(text) {
  const patterns = [
    /\b(\d+)\s*(?:pz|pezzi|pezzo|quantità|qty|q\.?ta)\b/i,
    /(?:pz|pezzi|pezzo|quantità|qty|q\.?ta)[\s.:]+(\d+)/i,
    /\b(\d+)\s*staff[ae]\b/i,
    /\b(\d+)\s*(?:carbonio|alluminio)\b/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const qty = parseInt(match[1]);
      if (qty >= 1 && qty <= 100) {
        return qty;
      }
    }
  }
  
  return 1; // Default
}

// Rileva il prezzo dal testo
function detectPrice(text) {
  const patterns = [
    /(?:€|euro|eur)[\s.:]+(\d+[.,]?\d*)/i,
    /(\d+[.,]?\d*)\s*(?:€|euro|eur)/i,
    /(?:prezzo|price|costo|totale|total)[\s.:]+(?:€|euro|eur)?\s*(\d+[.,]?\d*)/i,
    /(\d+[.,]?\d*)\s*(?:€|euro|eur)?\s*(?:totale|total)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (price >= 0 && price <= 10000) {
        return price;
      }
    }
  }
  
  return null;
}

// Rileva la fonte (source) dal testo
function detectSource(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('facebook') || textLower.includes('messenger') || textLower.includes('fb')) {
    return 'facebook';
  } else if (textLower.includes('subito') || textLower.includes('subito.it')) {
    return 'subito';
  } else if (textLower.includes('whatsapp') || textLower.includes('wa.me') || textLower.includes('+39')) {
    return 'whatsapp';
  }
  
  return 'direct';
}

// Funzione principale di parsing
async function parseCustomerData(text) {
  try {
    // Prima analisi con pattern locali per dati semplici
    const staffaInfo = detectStaffaType(text);
    const quantity = detectQuantity(text);
    const price = detectPrice(text);
    const source = detectSource(text);
    
    const prompt = `
Sei un assistente esperto nell'estrazione di dati di ordini per un'azienda che vende staffe per moto.
Analizza il testo fornito ed estrai TUTTE le informazioni disponibili.

REGOLE IMPORTANTI:
1. Se trovi menzioni di "carbonio", "carbon", "carbone" → il prodotto è CARBONIO
2. Se trovi menzioni di "alluminio", "aluminium", "aluminum" → il prodotto è ALLUMINIO
3. Per il paese: analizza la città, il CAP e il contesto. RESTITUISCI SEMPRE nel formato "Nome Paese (XX)" dove XX è il codice ISO a 2 lettere
4. Se il CAP è di 4 cifre e non inizia con 0 → probabilmente è Svizzera (CH)
5. Se il CAP inizia con 4789 → San Marino (SM)
6. Se il CAP è 00120 → Città del Vaticano (VA)
7. Se la provincia è una sigla italiana (RM, MI, TO, ecc.) → paese = Italia (IT)
8. Estrai anche: data vendita (se presente), codice tracking (se presente), note rilevanti
9. Per la fonte: cerca parole come "facebook", "messenger", "subito", "whatsapp", "telegram"
10. Se trovi "urgente" o "subito" nelle note, marca come urgente

ESEMPI FORMATO PAESE:
- Italia → "Italia (IT)"
- Svizzera → "Svizzera (CH)"
- Stati Uniti → "Stati Uniti (US)"
- Germania → "Germania (DE)"
- Francia → "Francia (FR)"

Rispondi SOLO in JSON valido con questa struttura:
{
  "customer_name": "nome completo o null",
  "customer_phone": "numero con prefisso internazionale o null",
  "customer_email": "email o null",
  "customer_address": "indirizzo completo (via, numero civico) o null",
  "customer_city": "città o null",
  "customer_zip": "CAP o codice postale o null",
  "customer_province": "sigla provincia (2 lettere) o null",
  "country": "paese nel formato 'Nome (XX)' - es: Italia (IT), Svizzera (CH), Stati Uniti (US) - o null",
  "product_model": "tipo di staffa rilevato: 'Staffa MV Agusta CARBONIO' o 'Staffa MV Agusta ALLUMINIO' o null",
  "quantity": numero o null,
  "price_total": numero o null,
  "source": "fonte rilevata: 'facebook', 'subito', 'whatsapp', 'direct' o null",
  "sale_date": "data nel formato YYYY-MM-DD o null",
  "tracking_code": "codice tracking o null",
  "is_urgent": true/false,
  "notes": "note aggiuntive rilevanti o null",
  "confidence": "high/medium/low"
}

Testo da analizzare:
${text}
    `;

    const aiResult = await geminiChat(prompt);
    const match = aiResult.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON non trovato');
    
    const parsedData = JSON.parse(match[0]);
    
    // Post-processing: verifica e correggi il paese
    if (!parsedData.country || parsedData.country === 'null') {
      parsedData.country = detectCountry(
        parsedData.customer_city,
        parsedData.customer_zip,
        parsedData.customer_province,
        text
      );
    }
    
    // Post-processing: verifica e correggi il tipo di staffa
    if (!parsedData.product_model || parsedData.product_model === 'null') {
      if (staffaInfo) {
        parsedData.product_model = staffaInfo.model;
      }
    }
    
    // Post-processing: verifica quantità
    if (!parsedData.quantity || parsedData.quantity === 'null' || parsedData.quantity === null) {
      parsedData.quantity = quantity;
    }
    
    // Post-processing: verifica prezzo
    if (!parsedData.price_total || parsedData.price_total === 'null' || parsedData.price_total === null) {
      parsedData.price_total = price;
    }
    
    // Post-processing: verifica source
    if (!parsedData.source || parsedData.source === 'null') {
      parsedData.source = source;
    }

    // Post-processing: verifica is_urgent
    if (parsedData.is_urgent === undefined || parsedData.is_urgent === null) {
      parsedData.is_urgent = false;
    }

    // Post-processing: verifica tracking_code
    if (!parsedData.tracking_code || parsedData.tracking_code === 'null') {
      parsedData.tracking_code = null;
    }

    // Post-processing: verifica sale_date
    if (!parsedData.sale_date || parsedData.sale_date === 'null') {
      parsedData.sale_date = null;
    }
    
    // Normalizza la provincia (solo sigla)
    if (parsedData.customer_province && parsedData.customer_province.length > 2) {
      // Cerca se è una provincia italiana per nome
      for (const [sigla, nome] of Object.entries(ITALIAN_PROVINCES)) {
        if (nome.toLowerCase() === parsedData.customer_province.toLowerCase()) {
          parsedData.customer_province = sigla.toUpperCase();
          break;
        }
      }
    }
    
    return parsedData;

  } catch (err) {
    console.error('Gemini AI Error (usato fallback locale):', err.message);
    
    // Fallback: restituisci i dati rilevati localmente
    const staffaInfo = detectStaffaType(text);
    const country = detectCountry(null, null, null, text);
    const qty = detectQuantity(text);
    const price = detectPrice(text);
    const src = detectSource(text);
    
    // Estrai anche nome e indirizzo con regex semplici
    const nameMatch = text.match(/(?:nome|name)[\s:]*([A-Z][a-z]+\s[A-Z][a-z]+)/i);
    const addressMatch = text.match(/(?:via|corso|piazza|viale|lungomare|strada)[\s.]*([^.\n,]+)/i);
    const cityMatch = text.match(/(?:città|city|comune)[\s:]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
    const zipMatch = text.match(/\b(\d{5})\b/);
    const phoneMatch = text.match(/(\+?\d[\d\s]{8,14}\d)/);
    const emailMatch = text.match(/([\w.-]+@[\w.-]+\.\w+)/);
    
    return {
      customer_name: nameMatch ? nameMatch[1].trim() : null,
      customer_phone: phoneMatch ? phoneMatch[1].trim() : null,
      customer_email: emailMatch ? emailMatch[1].trim() : null,
      customer_address: addressMatch ? addressMatch[0].trim() : null,
      customer_city: cityMatch ? cityMatch[1].trim() : null,
      customer_zip: zipMatch ? zipMatch[1] : null,
      customer_province: null,
      country: country,
      product_model: staffaInfo ? staffaInfo.model : null,
      quantity: qty,
      price_total: price,
      source: src,
      sale_date: null,
      tracking_code: null,
      is_urgent: text.toLowerCase().includes('urgente') || text.toLowerCase().includes('subito'),
      notes: null,
      confidence: 'low'
    };
  }
}

module.exports = { parseCustomerData, detectCountry, detectStaffaType };
