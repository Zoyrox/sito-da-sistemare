/**
 * MotoStaffa Office - Order Management System v3.0
 * Con AI avanzata, gestione etichette multiple, ricerca profonda e UI mobile migliorata
 */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const Database = require('./db');
const { requireAuth } = require('./middleware/auth');

const path = require('path');
const { parseCustomerData } = require(path.join(__dirname, 'services', 'aiParser'));

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy per Fly.io/Render
app.set('trust proxy', 1);

// Database
const db = new Database();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com"],
    },
  },
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  },
  name: 'motostaffa.sid'
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Troppi tentativi. Riprova piu tardi.' }
});

// Helper per async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { error: null });
});

app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (username !== adminUser) {
    return res.render('login', { error: 'Credenziali non valide' });
  }

  let valid = false;
  if (adminHash) {
    valid = bcrypt.compareSync(password, adminHash);
  }

  if (valid) {
    req.session.user = { username, loginAt: new Date().toISOString() };
    return res.redirect('/');
  }

  res.render('login', { error: 'Credenziali non valide' });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Dashboard
app.get('/', requireAuth, asyncHandler(async (req, res) => {
  const stats = await db.getDashboardStats();
  const recentOrders = await db.getRecentOrders(10);
  const alerts = await db.getShippingAlerts();
  const labelQueue = await db.getLabelQueue();
  
  res.render('dashboard', { 
    user: req.session.user,
    stats,
    recentOrders,
    alerts,
    labelQueueCount: labelQueue.length
  });
}));

// API: AI Parser
app.post('/api/ai-parse', requireAuth, asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 5) {
    return res.status(400).json({ error: 'Testo troppo corto' });
  }

  try {
    const data = await parseCustomerData(text);
    
    if (!data) {
      return res.status(500).json({ error: 'Errore parsing AI' });
    }

    res.json(data);
  } catch (err) {
    console.error('AI Parse Error:', err);
    // Anche in caso di errore, restituisci un oggetto valido con confidence low
    res.json({
      customer_name: null,
      customer_phone: null,
      customer_email: null,
      customer_address: null,
      customer_city: null,
      customer_zip: null,
      customer_province: null,
      country: null,
      product_model: null,
      quantity: 1,
      price_total: null,
      source: 'direct',
      sale_date: null,
      tracking_code: null,
      is_urgent: false,
      notes: null,
      confidence: 'low',
      error: 'Errore durante l\'analisi'
    });
  }
}));

// API: Google Maps Geocoding - Migliorata con fallback
app.get('/api/geocode', requireAuth, asyncHandler(async (req, res) => {
  const { address, city, zip, province, country } = req.query;
  
  // Estrai il nome del paese senza il codice ISO
  const countryName = country ? country.replace(/\s*\([^)]*\)\s*$/, '').trim() : '';
  
  if (!address && !city && !zip) {
    return res.status(400).json({ error: 'Almeno un campo indirizzo richiesto' });
  }
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key non configurata' });
  }
  
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  // Prova diverse strategie di ricerca
  const searchStrategies = [];
  
  // Strategia 1: Indirizzo completo con tutti i campi
  if (address && city) {
    let fullQuery = `${address}, ${city}`;
    if (zip) fullQuery += ` ${zip}`;
    if (province) fullQuery += ` (${province})`;
    if (countryName) fullQuery += `, ${countryName}`;
    searchStrategies.push(fullQuery);
  }
  
  // Strategia 2: Indirizzo, città e paese
  if (address && city && countryName) {
    searchStrategies.push(`${address}, ${city}, ${countryName}`);
  }
  
  // Strategia 3: Solo città, CAP e paese
  if (city && zip && countryName) {
    searchStrategies.push(`${zip} ${city}, ${countryName}`);
  }
  
  // Strategia 4: Indirizzo e città
  if (address && city) {
    searchStrategies.push(`${address}, ${city}`);
  }
  
  // Strategia 5: Solo città e paese
  if (city && countryName) {
    searchStrategies.push(`${city}, ${countryName}`);
  }
  
  // Strategia 6: Solo città
  if (city) {
    searchStrategies.push(city);
  }
  
  // Strategia 7: Solo CAP e paese
  if (zip && countryName) {
    searchStrategies.push(`${zip}, ${countryName}`);
  }
  
  // Strategia 8: Solo l'indirizzo
  if (address) {
    searchStrategies.push(address);
  }
  
  let lastError = null;
  
  for (const searchQuery of searchStrategies) {
    try {
      const encodedAddress = encodeURIComponent(searchQuery);
      const regionParam = country === 'Italia' ? 'it' : '';
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}${regionParam ? '&region=' + regionParam : ''}&language=it`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        
        // Estrai i componenti dell'indirizzo
        const extracted = {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          location: result.geometry.location,
          street_number: null,
          route: null,
          locality: null,
          postal_code: null,
          administrative_area_level_2: null, // Provincia
          country: null,
          search_query_used: searchQuery
        };
        
        for (const component of components) {
          const types = component.types;
          if (types.includes('street_number')) {
            extracted.street_number = component.long_name;
          } else if (types.includes('route')) {
            extracted.route = component.long_name;
          } else if (types.includes('locality')) {
            extracted.locality = component.long_name;
          } else if (types.includes('postal_code')) {
            extracted.postal_code = component.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            extracted.administrative_area_level_2 = component.short_name;
          } else if (types.includes('country')) {
            extracted.country = component.long_name;
          }
        }
        
        return res.json({ success: true, result: extracted });
      }
    } catch (err) {
      lastError = err;
      console.log(`Geocoding fallback failed for: ${searchQuery}`);
    }
  }
  
  // Se arriviamo qui, nessuna strategia ha funzionato
  res.json({ success: false, status: 'NOT_FOUND', message: 'Indirizzo non trovato. Prova a inserire i dati manualmente.' });
}));

// API: Orders
app.get('/api/orders/search', requireAuth, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 1) return res.json({ orders: [] });
  const orders = await db.searchOrdersDeep(q);
  res.json({ orders });
}));

app.get('/api/orders', requireAuth, asyncHandler(async (req, res) => {
  const { status, source, urgent, product_model, is_subito_pickup, country, sortBy } = req.query;
  const orders = await db.getOrders({ 
    status, 
    source, 
    urgent: urgent === 'true',
    product_model,
    is_subito_pickup: is_subito_pickup === 'true' ? true : is_subito_pickup === 'false' ? false : undefined,
    country,
    sortBy
  });
  res.json({ orders });
}));

// API: Filter orders by product model type
app.get('/api/orders/filter/model', requireAuth, asyncHandler(async (req, res) => {
  const { type } = req.query; // 'carbonio', 'alluminio', 'all'
  const orders = await db.getOrdersByProductModel(type);
  res.json({ orders });
}));

app.get('/api/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  res.json({ order });
}));

app.post('/api/orders', requireAuth, asyncHandler(async (req, res) => {
  const orderData = {
    source: req.body.source,
    customer_name: req.body.customer_name,
    customer_phone: req.body.customer_phone,
    customer_email: req.body.customer_email || null,
    customer_address: req.body.customer_address || null,
    customer_city: req.body.customer_city || null,
    customer_zip: req.body.customer_zip || null,
    customer_province: req.body.customer_province || null,
    customer_country: req.body.customer_country || 'Italia',
    product_model: req.body.product_model,
    quantity: parseInt(req.body.quantity) || 1,
    price_total: parseFloat(req.body.price_total) || 0,
    status: req.body.status || 'pending',
    notes: req.body.notes || null,
    facebook_chat_url: req.body.facebook_chat_url || null,
    subito_ad_url: req.body.subito_ad_url || null,
    is_urgent: req.body.is_urgent === 'true' || req.body.is_urgent === true,
    is_subito_pickup: req.body.is_subito_pickup === 'true' || req.body.is_subito_pickup === true,
    subito_address_optional: req.body.subito_address_optional === 'true' || req.body.subito_address_optional === true,
    sale_date: req.body.sale_date || null,
    order_display_number: req.body.order_display_number || null
  };

  const result = await db.createOrder(orderData);
  res.json({ success: true, orderId: result.lastID, orderNumber: result.orderNumber, displayNumber: result.displayNumber });
}));

app.put('/api/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const existing = await db.getOrderById(orderId);
  
  if (!existing) return res.status(404).json({ error: 'Ordine non trovato' });

  const updateData = {};
  
  ['source', 'customer_name', 'customer_phone', 'customer_email', 
   'customer_address', 'customer_city', 'customer_zip', 'customer_province', 'customer_country',
   'product_model', 'tracking_code', 'notes', 'facebook_chat_url', 'subito_ad_url', 'sale_date', 'order_display_number']
    .forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

  if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
  if (req.body.price_total !== undefined) updateData.price_total = parseFloat(req.body.price_total);
  if (req.body.is_urgent !== undefined) updateData.is_urgent = req.body.is_urgent === 'true' ? 1 : 0;
  if (req.body.is_subito_pickup !== undefined) updateData.is_subito_pickup = req.body.is_subito_pickup === 'true' ? 1 : 0;
  if (req.body.subito_address_optional !== undefined) updateData.subito_address_optional = req.body.subito_address_optional === 'true' ? 1 : 0;
  
  if (req.body.status) {
    updateData.status = req.body.status;
    if (req.body.status === 'shipped' && existing.status !== 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    }
  }

  await db.updateOrder(orderId, updateData);
  res.json({ success: true });
}));

app.delete('/api/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  
  await db.deleteOrder(req.params.id);
  res.json({ success: true });
}));

app.patch('/api/orders/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Stato non valido' });
  }

  const updateData = { status };
  if (status === 'shipped') {
    updateData.shipped_at = new Date().toISOString();
  }

  await db.updateOrder(req.params.id, updateData);
  res.json({ success: true });
}));

// API: Update order display number
app.patch('/api/orders/:id/display-number', requireAuth, asyncHandler(async (req, res) => {
  const { display_number } = req.body;
  
  if (!display_number || !display_number.match(/^#?\d+$/)) {
    return res.status(400).json({ error: 'Numero ordine non valido. Usa formato #123' });
  }
  
  const formattedNumber = display_number.startsWith('#') ? display_number : `#${display_number}`;
  
  try {
    await db.updateOrderDisplayNumber(req.params.id, formattedNumber);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}));

// API: Reorder all display numbers
app.post('/api/orders/reorder-numbers', requireAuth, asyncHandler(async (req, res) => {
  const result = await db.reorderDisplayNumbers();
  res.json({ success: true, reordered: result.reordered });
}));

// API: Duplicate order
app.post('/api/orders/:id/duplicate', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Ordine non trovato' });
  }
  
  // Create duplicate without ID and with new display number
  const { id, order_display_number, created_at, updated_at, ...orderData } = order;
  
  const newOrder = await db.createOrder({
    ...orderData,
    status: 'pending',
    tracking_code: null,
    shipped_at: null,
    delivered_at: null,
    notes: order.notes ? `${order.notes}\n\n[Duplicato da ordine ${order.order_display_number || '#' + order.id}]` : `[Duplicato da ordine ${order.order_display_number || '#' + order.id}]`
  });
  
  res.json({ success: true, order: newOrder });
}));

// API: Label Queue
app.get('/api/label-queue', requireAuth, asyncHandler(async (req, res) => {
  const orders = await db.getLabelQueue();
  res.json({ orders });
}));

app.post('/api/label-queue/:orderId', requireAuth, asyncHandler(async (req, res) => {
  await db.addToLabelQueue(req.params.orderId);
  res.json({ success: true });
}));

app.delete('/api/label-queue/:orderId', requireAuth, asyncHandler(async (req, res) => {
  await db.removeFromLabelQueue(req.params.orderId);
  res.json({ success: true });
}));

app.delete('/api/label-queue', requireAuth, asyncHandler(async (req, res) => {
  await db.clearLabelQueue();
  res.json({ success: true });
}));

app.get('/api/label-queue/:orderId/check', requireAuth, asyncHandler(async (req, res) => {
  const isInQueue = await db.isInLabelQueue(req.params.orderId);
  res.json({ inQueue: isInQueue });
}));

// API: Templates
app.get('/api/product-templates', requireAuth, asyncHandler(async (req, res) => {
  const templates = await db.getProductTemplates();
  res.json({ templates });
}));

app.get('/api/comuni/:cap', requireAuth, asyncHandler(async (req, res) => {
  const comuni = await db.lookupComuneByCap(req.params.cap);
  if (comuni && comuni.length > 0) {
    res.json({ comune: comuni[0] });
  } else {
    res.json({ comune: null });
  }
}));

// API: Export
app.get('/api/export', requireAuth, asyncHandler(async (req, res) => {
  const orders = await db.getAllOrdersForExport();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=orders-backup.json');
  res.json({ orders, exportedAt: new Date().toISOString() });
}));

// API: Stats
app.get('/api/stats', requireAuth, asyncHandler(async (req, res) => {
  const stats = await db.getDashboardStats();
  res.json({ stats });
}));

// Pages: Orders
app.get('/orders/new', requireAuth, asyncHandler(async (req, res) => {
  const templates = await db.getProductTemplates();
  res.render('order-form', { user: req.session.user, order: null, templates, mode: 'create' });
}));

app.get('/orders/:id/edit', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) return res.redirect('/');
  
  const templates = await db.getProductTemplates();
  res.render('order-form', { user: req.session.user, order, templates, mode: 'edit' });
}));

app.get('/orders/:id', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) return res.redirect('/');
  
  const trackingUrl = order.tracking_code 
    ? `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${order.tracking_code}`
    : null;
  
  res.render('order-detail', { user: req.session.user, order, trackingUrl });
}));

// Etichetta singola
app.get('/orders/:id/label', requireAuth, asyncHandler(async (req, res) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) return res.redirect('/');
  res.render('print-label', { orders: [order], singleMode: true });
}));

// Etichette multiple
app.get('/labels/print', requireAuth, asyncHandler(async (req, res) => {
  const orders = await db.getLabelQueue();
  if (orders.length === 0) {
    return res.redirect('/');
  }
  res.render('print-label', { orders, singleMode: false });
}));

// Pagina gestione etichette
app.get('/labels/queue', requireAuth, asyncHandler(async (req, res) => {
  const orders = await db.getLabelQueue();
  res.render('label-queue', { user: req.session.user, orders });
}));

// Pagina ricerca avanzata
app.get('/search', requireAuth, asyncHandler(async (req, res) => {
  res.render('search', { user: req.session.user, query: req.query.q || '', orders: [] });
}));

// Pagina statistiche
app.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const stats = await db.getDashboardStats();
  res.render('stats', { user: req.session.user, stats });
}));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Errore interno del server' });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Pagina non trovata' });
});

// Start
app.listen(PORT, () => {
  console.log('🚀 MotoStaffa Office v3.0 avviato');
  console.log(`📊 Database: ${db.dbPath}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});
