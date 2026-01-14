const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT id, type FROM resources WHERE type LIKE '%pantalla%'", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Records found:', rows);

        if (rows.length > 0) {
            const stmt = db.prepare("UPDATE resources SET type = 'Tower' WHERE id = ?");
            rows.forEach(row => {
                stmt.run(row.id);
                console.log(`Updated ID ${row.id}`);
            });
            stmt.finalize();
        } else {
            console.log('No records found with "pantalla" in type.');
        }
    });
});

db.close();
