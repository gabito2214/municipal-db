const db = require('./database');
const fs = require('fs');

async function restoreBackup() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Error: Debes proporcionar el nombre del archivo de backup.");
        console.log("Ejemplo: node restore_data.js municipal_backup_2024-01-23.json");
        process.exit(1);
    }

    const filename = args[0];
    if (!fs.existsSync(filename)) {
        console.error(`Error: El archivo '${filename}' no existe.`);
        process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const tables = Object.keys(backup.data);

    console.log(`--- RESTAURANDO BACKUP (${backup.timestamp}) ---`);

    db.serialize(async () => {
        for (const table of tables) {
            const rows = backup.data[table];
            if (!rows || rows.length === 0) continue;

            // 1. Limpiar tabla actual
            db.run(`DELETE FROM ${table}`, (err) => {
                if (err) console.error(`Error limpiando ${table}:`, err.message);
            });

            // 2. Insertar datos
            const columns = Object.keys(rows[0]).join(', ');
            const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');
            const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

            rows.forEach(row => {
                const values = Object.values(row);
                db.run(sql, values, (err) => {
                    if (err) console.error(`Error insertando en ${table}:`, err.message);
                });
            });

            console.log(`[OK] Tabla ${table}: ${rows.length} registros restaurados.`);
        }
    });

    console.log("Procedimiento finalizado. Verifica los datos en el dashboard.");
}

restoreBackup();
