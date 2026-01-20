const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const tables = ['roles', 'users', 'projects', 'toners', 'toner_stock', 'resources'];

console.log("=== Conteo de Registros Locales ===");

let completed = 0;
tables.forEach(table => {
    db.get(`SELECT count(*) as count FROM ${table}`, (err, row) => {
        if (err) {
            console.error(`Error en tabla ${table}:`, err.message);
        } else {
            console.log(`${table}: ${row.count} registros`);
        }
        completed++;
        if (completed === tables.length) {
            db.close();
        }
    });
});
