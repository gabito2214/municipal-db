const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const statusMap = {
    'Planificación': 'Iniciado',
    'En Ejecución': 'En Trámite',
    'Finalizada': 'Finalizado',
    'Detenida': 'Pausado',
    'Cancelada': 'Archivado'
};

db.serialize(() => {
    console.log("Starting migration...");

    // 1. Rename old table
    db.run("ALTER TABLE projects RENAME TO projects_old", (err) => {
        if (err && !err.message.includes("no such table")) {
            console.error("Error renaming table:", err);
            return;
        }
    });

    // 2. Create new table (Constraint removed to allow flexibility, or updated)
    // Removed CHECK constraint on status to avoid future issues with renaming
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT, 
        start_date TEXT,
        end_date TEXT,
        budget REAL,
        custom_attributes TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. Copy data
    db.all("SELECT * FROM projects_old", [], (err, rows) => {
        if (err) {
            console.log("No old data or error reading:", err);
            return;
        }

        const stmt = db.prepare("INSERT INTO projects (id, name, status, start_date, end_date, budget, custom_attributes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        rows.forEach(row => {
            let newStatus = statusMap[row.status] || row.status;
            stmt.run(row.id, row.name, newStatus, row.start_date, row.end_date, row.budget, row.custom_attributes, row.created_at);
        });

        stmt.finalize(() => {
            console.log("Data migrated.");
            // 4. Drop old table
            db.run("DROP TABLE projects_old", (err) => {
                if (err) console.error("Error dropping old table:", err);
                else console.log("Old table dropped. Migration complete.");
            });
        });
    });
});
