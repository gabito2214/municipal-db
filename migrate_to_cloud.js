const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

async function migrate() {
    console.log("=== Iniciando Migración Completa de Datos ===");

    if (!process.env.DATABASE_URL) {
        console.error("ERROR: Debes configurar la variable DATABASE_URL con tu URL de Railway.");
        process.exit(1);
    }

    const dbLocal = new sqlite3.Database(path.resolve(__dirname, 'municipal.db'));
    const poolCloud = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const tables = ['roles', 'users', 'projects', 'toners', 'toner_stock', 'resources'];

    try {
        for (const table of tables) {
            console.log(`\nMigrando tabla: ${table}...`);

            // Read local
            const rows = await new Promise((resolve, reject) => {
                dbLocal.all(`SELECT * FROM ${table}`, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (rows.length === 0) {
                console.log(`  No hay datos en ${table}.`);
                continue;
            }

            // Clear remote table (opcional, pero para asegurar limpieza si se reintenta)
            // CUIDADO: En Postgres, TRUNCATE RESTART IDENTITY es ideal.
            await poolCloud.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

            // Insert into remote
            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row);

                // Convert ? to $1, $2 symbols for pg
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const columns = keys.join(', ');

                const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
                await poolCloud.query(sql, values);
            }
            console.log(`  ${rows.length} registros migrados exitosamente.`);
        }

        console.log("\n=== Migración Finalizada con Éxito ===");
    } catch (err) {
        console.error("\nERROR durante la migración:", err.message);
    } finally {
        dbLocal.close();
        await poolCloud.end();
    }
}

migrate();
