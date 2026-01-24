// const sqlite3 = require('sqlite3').verbose(); // Removed top-level require for cloud compatibility
const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';
let db;

const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
    console.log('--- CONEXIÓN CLOUD ---');
    console.log('Conectando a PostgreSQL (Neon)...');
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // Wrapper for pg to mimic sqlite3 basic methods used in the app
    db = {
        run: function (sql, params, callback) {
            let i = 1;
            let pgSql = sql.replace(/\?/g, () => `$${i++}`);

            // Auto-append RETURNING id for INSERTs if not present
            if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
                pgSql += ' RETURNING id';
            }

            pool.query(pgSql, params, (err, res) => {
                // Map PostgreSQL result to SQLite-style "this" context
                const safeLastID = (res && res.rows && res.rows.length > 0) ? res.rows[0].id : null;
                const safeChanges = res ? res.rowCount : 0;

                if (callback) callback.call({ lastID: safeLastID, changes: safeChanges }, err);
            });
        },
        get: function (sql, params, callback) {
            let i = 1;
            const pgSql = sql.replace(/\?/g, () => `$${i++}`);
            pool.query(pgSql, params, (err, res) => {
                if (callback) callback(err, res ? res.rows[0] : null);
            });
        },
        all: function (sql, params, callback) {
            let i = 1;
            const pgSql = sql.replace(/\?/g, () => `$${i++}`);
            pool.query(pgSql, params, (err, res) => {
                if (callback) callback(err, res ? res.rows : []);
            });
        },
        serialize: function (callback) {
            callback();
        }
    };
    initDb();
} else if (isProduction) {
    console.error('--- ERROR CRÍTICO ---');
    console.error('DATABASE_URL no encontrada en el entorno de producción.');
    console.error('El sistema está en modo mantenimiento.');

    // Mock DB to prevent crash but avoid SQLite fallback in cloud
    db = {
        serialize: (cb) => { if (cb) cb(); },
        run: (sql, params, cb) => { if (cb) cb(new Error("DATABASE_URL_MISSING")); },
        get: (sql, params, cb) => { if (cb) cb(new Error("DATABASE_URL_MISSING")); },
        all: (sql, params, cb) => { if (cb) cb(new Error("DATABASE_URL_MISSING")); }
    };
} else {
    // Local SQLite - Development only
    console.log('--- CONEXIÓN LOCAL ---');
    let sqlite3;
    try {
        sqlite3 = require('sqlite3').verbose();
    } catch (e) {
        console.error("CRITICAL: FAILED to load sqlite3 and DATABASE_URL is missing.");
        console.error("The app will start in 'Maintenance Mode' (No Database).");
        console.error("Please set DATABASE_URL in Railway Variables.");
        // process.exit(1); // Don't crash, allow server to verify network

        // Mock DB to prevent immediate crash on listener
        db = {
            serialize: (cb) => { if (cb) cb(); },
            run: (sql, params, cb) => { console.error("DB Not connected: " + sql); if (cb) cb(new Error("DB_NOT_CONNECTED")); },
            get: (sql, params, cb) => { console.error("DB Not connected"); if (cb) cb(new Error("DB_NOT_CONNECTED")); },
            all: (sql, params, cb) => { console.error("DB Not connected"); if (cb) cb(new Error("DB_NOT_CONNECTED")); }
        };
    }

    if (sqlite3) {
        const dbPath = path.resolve(__dirname, 'municipal.db');
        const sqliteDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database.');
                initDb();
            }
        });
        db = sqliteDb;
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function initDb() {
    db.serialize(() => {
        // SQL adjustments for PostgreSQL compatibility (Serial, Text, Real)
        const idType = isProduction ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
        const timestampType = isProduction ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

        // 1. Roles
        db.run(`CREATE TABLE IF NOT EXISTS roles (
            id ${idType},
            name TEXT UNIQUE NOT NULL,
            permissions TEXT DEFAULT '{}'
        )`);

        // 2. Users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id ${idType},
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            role_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            last_login ${isProduction ? 'TIMESTAMP' : 'DATETIME'},
            created_at ${timestampType}
        )`);

        // 3. Projects
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id ${idType},
            name TEXT NOT NULL,
            status TEXT,
            start_date TEXT,
            end_date TEXT,
            budget REAL,
            custom_attributes TEXT DEFAULT '{}',
            created_at ${timestampType}
        )`);

        // 5. Toners
        db.run(`CREATE TABLE IF NOT EXISTS toners (
            id ${idType},
            delivery_date TEXT,
            receiver_name TEXT,
            receiver_dni TEXT,
            receiver_position TEXT,
            receiver_area TEXT,
            printer_brand TEXT,
            toner_brand TEXT,
            toner_model TEXT,
            delivered_by TEXT,
            created_at ${timestampType}
        )`);

        // 6. Toner Stock
        db.run(`CREATE TABLE IF NOT EXISTS toner_stock (
            id ${idType},
            model TEXT UNIQUE NOT NULL,
            quantity INTEGER DEFAULT 0,
            description TEXT,
            last_updated ${timestampType}
        )`);

        // 7. Resources (Inventory)
        db.run(`CREATE TABLE IF NOT EXISTS resources (
            id ${idType},
            location TEXT,
            name TEXT,
            type TEXT,
            stock_quantity INTEGER DEFAULT 1,
            unit TEXT,
            nomenclature TEXT,
            ip TEXT,
            user_name TEXT,
            entry_date TEXT,
            specifications TEXT DEFAULT '{}',
            created_at ${timestampType}
        )`);

        // 8. Supply Deliveries
        db.run(`CREATE TABLE IF NOT EXISTS supply_deliveries (
            id ${idType},
            location TEXT,
            supply_name TEXT,
            delivery_date TEXT,
            receiver_name TEXT,
            notes TEXT,
            attachment_url TEXT,
            created_at ${timestampType}
        )`);

        // Seed Data
        seedData();
    });
}

function seedData() {
    db.get("SELECT id FROM users WHERE username = ?", ['Sistemas'], (err, row) => {
        if (!row) {
            if (isProduction) {
                console.log("Database empty in production. Waiting for manual migration.");
                return;
            }
            console.log("Seeding initial data...");

            db.run("INSERT INTO roles (name, permissions) VALUES ('Administrador', '{\"all\": true}')", [], () => {
                const adminPass = hashPassword('J.Grillo');
                db.run("INSERT INTO users (username, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)",
                    ['Sistemas', adminPass, 'Admin Sistemas', 1], () => {
                        db.run("INSERT INTO projects (name, status, start_date, budget, custom_attributes) VALUES (?, ?, ?, ?, ?)",
                            ['Repavimentación Calle Principal', 'En Ejecución', '2023-11-01', 5000000.00, JSON.stringify({ expediente: 'EXP-999' })]);
                    });
            });

            console.log("Seed data requested.");
        } else {
            console.log("Database already initialized.");
        }
    });
}

module.exports = db;
