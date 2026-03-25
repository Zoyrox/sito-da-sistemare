/**
 * Database module - SQLite persistente
 */

const fs = require('fs');
const path = require('path');

// Usa sempre SQLite con file su disco
const dataDir = process.env.FLY_ALLOC_ID ? '/data' : path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
console.log('📁 Database path:', dbPath);

let db;
let Database;

try {
  Database = require('better-sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  console.log('✅ SQLite (better-sqlite3) caricato');
} catch (e1) {
  try {
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(dbPath);
    console.log('✅ SQLite (sqlite3) caricato');
  } catch (e2) {
    console.error('❌ Nessun modulo SQLite trovato. Installa con: npm install better-sqlite3');
    process.exit(1);
  }
}

class AppDatabase {
  constructor() {
    this.db = db;
    this.isBetter = !!Database;
    this.dbPath = dbPath;
    this.initTables();
    this.seedData();
  }

  initTables() {
    const createOrders = `
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE,
        source TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        customer_address TEXT,
        customer_city TEXT,
        customer_zip TEXT,
        customer_province TEXT,
        product_model TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        price_total REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        tracking_code TEXT,
        notes TEXT,
        facebook_chat_url TEXT,
        subito_ad_url TEXT,
        is_urgent INTEGER DEFAULT 0,
        is_subito_pickup INTEGER DEFAULT 0,
        subito_address_optional INTEGER DEFAULT 0,
        sale_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        shipped_at DATETIME
      )
    `;

    const createTemplates = `
      CREATE TABLE IF NOT EXISTS product_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        default_price REAL DEFAULT 0,
        is_active INTEGER DEFAULT 1
      )
    `;

    const createComuni = `
      CREATE TABLE IF NOT EXISTS italian_comuni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        provincia TEXT NOT NULL,
        cap TEXT NOT NULL
      )
    `;

    if (this.isBetter) {
      this.db.exec(createOrders);
      this.db.exec(createTemplates);
      this.db.exec(createComuni);
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
      this.db.exec('CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)');
    } else {
      this.db.run(createOrders);
      this.db.run(createTemplates);
      this.db.run(createComuni);
    }
  }
  
  seedData() {
    // Product templates
    const checkTemplates = this.isBetter 
      ? this.db.prepare('SELECT COUNT(*) as count FROM product_templates').get()
      : null;

    if (!this.isBetter || checkTemplates.count === 0) {
      const templates = [
        ['Staffa CARBONIO', 'Staffa MV Agusta CARBONIO', 55.00],
        ['Staffa ALLUMINIO', 'Staffa MV Agusta ALLUMINIO', 35.00],
      ];

      if (this.isBetter) {
        const stmt = this.db.prepare('INSERT INTO product_templates (model, name, default_price) VALUES (?, ?, ?)');
        templates.forEach(t => stmt.run(t));
      } else {
        templates.forEach(t => {
          this.db.run('INSERT INTO product_templates (model, name, default_price) VALUES (?, ?, ?)', t);
        });
      }
      console.log(`✅ ${templates.length} template prodotti inseriti`);
    }

    // Comuni italiani principali
    const checkComuni = this.isBetter
      ? this.db.prepare('SELECT COUNT(*) as count FROM italian_comuni').get()
      : null;

    if (!this.isBetter || checkComuni.count === 0) {
      const comuni = [
        ['Roma', 'RM', '00100'], ['Milano', 'MI', '20100'], ['Napoli', 'NA', '80100'],
        ['Torino', 'TO', '10100'], ['Palermo', 'PA', '90100'], ['Genova', 'GE', '16100'],
        ['Bologna', 'BO', '40100'], ['Firenze', 'FI', '50100'], ['Bari', 'BA', '70100'],
        ['Catania', 'CT', '95100'], ['Venezia', 'VE', '30100'], ['Verona', 'VR', '37100'],
        ['Messina', 'ME', '98100'], ['Padova', 'PD', '35100'], ['Trieste', 'TS', '34100'],
        ['Brescia', 'BS', '25100'], ['Parma', 'PR', '43100'], ['Modena', 'MO', '41100'],
        ['Reggio Emilia', 'RE', '42100'], ['Ravenna', 'RA', '48100']
      ];

      if (this.isBetter) {
        const stmt = this.db.prepare('INSERT INTO italian_comuni (nome, provincia, cap) VALUES (?, ?, ?)');
        comuni.forEach(c => stmt.run(c));
      } else {
        comuni.forEach(c => {
          this.db.run('INSERT INTO italian_comuni (nome, provincia, cap) VALUES (?, ?, ?)', c);
        });
      }
      console.log(`✅ ${comuni.length} comuni inseriti`);
    }
  }

  // Generate order number
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MS${year}${month}${day}-${random}`;
  }

  // CRUD Operations
  createOrder(data) {
    const orderNumber = data.order_number || this.generateOrderNumber();
    const sql = `
      INSERT INTO orders (order_number, source, customer_name, customer_phone, customer_email,
        customer_address, customer_city, customer_zip, customer_province,
        product_model, quantity, price_total, status, notes,
        facebook_chat_url, subito_ad_url, is_urgent, is_subito_pickup, subito_address_optional, sale_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      orderNumber,
      data.source, data.customer_name, data.customer_phone, data.customer_email || null,
      data.customer_address || null, data.customer_city || null, data.customer_zip || null, data.customer_province || null,
      data.product_model, data.quantity || 1, data.price_total || 0, data.status || 'pending',
      data.notes || null, data.facebook_chat_url || null, data.subito_ad_url || null,
      data.is_urgent ? 1 : 0,
      data.is_subito_pickup ? 1 : 0,
      data.subito_address_optional ? 1 : 0,
      data.sale_date || null
    ];

    if (this.isBetter) {
      const result = this.db.prepare(sql).run(params);
      return { lastID: result.lastInsertRowid, orderNumber };
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, orderNumber });
        });
      });
    }
  }

  getOrderById(id) {
    const sql = 'SELECT * FROM orders WHERE id = ?';
    if (this.isBetter) {
      return this.db.prepare(sql).get(id);
    }
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getOrders(filters = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }
    if (filters.urgent) {
      sql += ' AND is_urgent = 1';
    }
    if (filters.product_model) {
      sql += ' AND product_model LIKE ?';
      params.push(`%${filters.product_model}%`);
    }
    if (filters.is_subito_pickup !== undefined) {
      sql += ' AND is_subito_pickup = ?';
      params.push(filters.is_subito_pickup ? 1 : 0);
    }

    sql += ' ORDER BY is_urgent DESC, created_at DESC';

    if (this.isBetter) {
      return this.db.prepare(sql).all(...params);
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getOrdersByProductModel(modelType) {
    let sql = 'SELECT * FROM orders';
    const params = [];
    
    if (modelType === 'carbonio') {
      sql += ' WHERE product_model LIKE ?';
      params.push('%CARBONIO%');
    } else if (modelType === 'alluminio') {
      sql += ' WHERE product_model LIKE ?';
      params.push('%ALLUMINIO%');
    }
    // Se modelType è 'all' o non specificato, restituisce tutti gli ordini
    
    sql += ' ORDER BY is_urgent DESC, created_at DESC';
    
    if (this.isBetter) {
      return this.db.prepare(sql).all(...params);
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getRepeatCustomers() {
    const sql = `
      SELECT customer_name, customer_phone, customer_email, 
             customer_address, customer_city, customer_zip, customer_province,
             COUNT(*) as order_count, 
             GROUP_CONCAT(DISTINCT product_model) as products,
             MAX(created_at) as last_order
      FROM orders 
      WHERE status != 'cancelled'
      GROUP BY customer_phone 
      HAVING order_count > 1
      ORDER BY order_count DESC, last_order DESC
    `;
    
    if (this.isBetter) {
      return this.db.prepare(sql).all();
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getRecentOrders(limit = 10) {
    const sql = 'SELECT * FROM orders ORDER BY is_urgent DESC, created_at DESC LIMIT ?';
    if (this.isBetter) {
      return this.db.prepare(sql).all(limit);
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  updateOrder(id, data) {
    const fields = [];
    const params = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) return;

    params.push(id);
    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;

    if (this.isBetter) {
      return this.db.prepare(sql).run(...params);
    }
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  deleteOrder(id) {
    const sql = 'DELETE FROM orders WHERE id = ?';
    if (this.isBetter) {
      return this.db.prepare(sql).run(id);
    }
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  searchOrders(query) {
    const search = `%${query}%`;
    const sql = `
      SELECT * FROM orders 
      WHERE customer_name LIKE ? OR customer_phone LIKE ? OR tracking_code LIKE ?
      OR customer_city LIKE ? OR CAST(id AS TEXT) LIKE ?
      ORDER BY is_urgent DESC, created_at DESC LIMIT 50
    `;
    const params = [search, search, search, search, search];

    if (this.isBetter) {
      return this.db.prepare(sql).all(...params);
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Stats
  getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];

    if (this.isBetter) {
      return {
        today: this.db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(price_total), 0) as revenue FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'`).get(today),
        toShip: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')").get(),
        inTransit: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'").get(),
        toReview: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND DATE(created_at) >= DATE('now', '-30 days')").get(),
        urgent: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE is_urgent = 1 AND status NOT IN ('delivered', 'cancelled')").get(),
        monthlyRevenue: this.db.prepare("SELECT COALESCE(SUM(price_total), 0) as total FROM orders WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') AND status != 'cancelled'").get(),
        carbonio: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE product_model LIKE '%CARBONIO%' AND status != 'cancelled'").get(),
        alluminio: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE product_model LIKE '%ALLUMINIO%' AND status != 'cancelled'").get(),
        subitoPickup: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE is_subito_pickup = 1 AND status != 'cancelled'").get(),
        totalOrders: this.db.prepare("SELECT COUNT(*) as count FROM orders WHERE status != 'cancelled'").get(),
        repeatCustomers: this.db.prepare("SELECT COUNT(*) as count FROM (SELECT customer_phone FROM orders WHERE status != 'cancelled' GROUP BY customer_phone HAVING COUNT(*) > 1)").get()
      };
    }

    return new Promise((resolve, reject) => {
      const stats = {};
      this.db.get(`SELECT COUNT(*) as count, COALESCE(SUM(price_total), 0) as revenue FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'`, [today], (err, row) => {
        if (err) reject(err);
        stats.today = row;
        this.db.get("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'processing')", (err, row) => {
          stats.toShip = row;
          this.db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'shipped'", (err, row) => {
            stats.inTransit = row;
            resolve(stats);
          });
        });
      });
    });
  }

  getShippingAlerts() {
    const sql = `
      SELECT * FROM orders 
      WHERE status = 'shipped' AND shipped_at IS NOT NULL
      AND DATE(shipped_at) <= DATE('now', '-7 days')
      ORDER BY shipped_at ASC
    `;
    if (this.isBetter) {
      return this.db.prepare(sql).all();
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getProductTemplates() {
    const sql = 'SELECT * FROM product_templates WHERE is_active = 1 ORDER BY name ASC';
    if (this.isBetter) {
      return this.db.prepare(sql).all();
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getAllOrdersForExport() {
    const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
    if (this.isBetter) {
      return this.db.prepare(sql).all();
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  lookupComuneByCap(cap) {
    const sql = 'SELECT * FROM italian_comuni WHERE cap = ?';
    if (this.isBetter) {
      return this.db.prepare(sql).all(cap);
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [cap], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = AppDatabase;