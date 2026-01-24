const db = require('./database');
const fs = require('fs');
const path = require('path');

const tables = [
    'roles',
    'users',
    'projects',
    'toners',
    'toner_stock',
    'resources',
    'supply_deliveries'
];

async function runBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        data: {}
    };

    console.log("--- INICIANDO BACKUP DE SEGURIDAD ---");

    for (const table of tables) {
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            backup.data[table] = rows;
            console.log(`[OK] Tabla ${table}: ${rows.length} registros exportados.`);
        } catch (err) {
            console.error(`[ERROR] Fallo al leer tabla ${table}:`, err.message);
        }
    }

    const dateStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
    const filename = `municipal_backup_${dateStr}.json`;

    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));

    console.log("-----------------------------------------");
    console.log(`¡BACKUP COMPLETADO CON ÉXITO!`);
    console.log(`Archivo guardado: ${filename}`);
    console.log("Guarda este archivo en un lugar seguro (USB, Drive, etc.).");
    console.log("-----------------------------------------");

    process.exit(0);
}

runBackup();
