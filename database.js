const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');

const isProduction = process.env.DATABASE_URL !== undefined;
let db;

if (isProduction) {
    console.log('Connecting to PostgreSQL database...');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // Wrapper for pg to mimic sqlite3 basic methods used in the app
    db = {
        run: function (sql, params, callback) {
            // Convert ? to $1, $2, etc.
            let i = 1;
            const pgSql = sql.replace(/\?/g, () => `$${i++}`);
            pool.query(pgSql, params, (err, res) => {
                if (callback) callback.call({ lastID: res ? res.rows[0]?.id : null, changes: res ? res.rowCount : 0 }, err);
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
            callback(); // pg doesn't need serialize like sqlite
        }
    };
    initDb();
} else {
    // Local SQLite
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

        // Seed Data
        seedData();
    });
}

function seedData() {
    db.get("SELECT id FROM users WHERE username = ?", ['Sistemas'], (err, row) => {
        if (!row) {
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
