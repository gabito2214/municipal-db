const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');

async function migrate() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("ERROR: DATABASE_URL environment variable is missing.");
        process.exit(1);
    }

    console.log("Connecting to local SQLite...");
    const sqliteDbPath = path.resolve(__dirname, 'municipal.db');
    const sqliteDb = new sqlite3.Database(sqliteDbPath);

    console.log("Connecting to production PostgreSQL...");
    const pgClient = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pgClient.connect();
        console.log("Connected successfully to PostgreSQL.");

        // Schema sync: Ensure user_name exists in production
        console.log("Checking production schema...");
        await pgClient.query("ALTER TABLE resources ADD COLUMN IF NOT EXISTS user_name TEXT");
        console.log("Production schema updated.");

        const tables = [
            'roles',
            'users',
            'projects',
            'toners',
            'toner_stock',
            'resources',
            'supply_deliveries'
        ];

        for (const table of tables) {
            console.log(`\nMigrating table: ${table}...`);

            const rows = await new Promise((resolve, reject) => {
                sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log(`Found ${rows.length} rows in ${table}.`);

            if (rows.length === 0) continue;

            // Clear destination table first (Careful: This replaces production data)
            console.log(`Clearing production table ${table}...`);
            await pgClient.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

            const columns = Object.keys(rows[0]);
            const columnList = columns.join(', ');
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const insertSql = `INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`;

            for (const row of rows) {
                const values = columns.map(col => {
                    let val = row[col];
                    // Handle JSON strings
                    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                        try {
                            // Check if it's already a JSON string, keep as is
                            JSON.parse(val);
                        } catch (e) {
                            // Not JSON, keep as string
                        }
                    }
                    return val;
                });
                await pgClient.query(insertSql, values);
            }
            console.log(`Finished migrating ${table}.`);
        }

        console.log("\n=== Migration Completed Successfully ===");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        sqliteDb.close();
        await pgClient.end();
    }
}

migrate();
