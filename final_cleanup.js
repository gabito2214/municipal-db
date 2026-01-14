const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Standardize 'Tower (una pantalla)'
    db.run("UPDATE resources SET type = 'Tower' WHERE type LIKE '%una pantalla%'", function (err) {
        if (err) console.error(err);
        else console.log(`Standardized ${this.changes} equipment types.`);
    });

    // 2. Correct 'DABWOD' to 'DAEWOO' in specifications
    db.all("SELECT id, specifications FROM resources WHERE specifications LIKE '%DABWOD%'", (err, rows) => {
        if (err) {
            console.error(err);
            db.close();
            return;
        }

        if (rows.length === 0) {
            console.log("No 'DABWOD' brands found in specifications.");
            db.close();
            return;
        }

        const stmt = db.prepare("UPDATE resources SET specifications = ? WHERE id = ?");
        let completed = 0;
        rows.forEach(row => {
            const updated = row.specifications.replace(/DABWOD/g, 'DAEWOO');
            stmt.run(updated, row.id, (err) => {
                completed++;
                if (completed === rows.length) {
                    stmt.finalize();
                    console.log(`Updated brand in ${rows.length} rows.`);
                    db.close();
                }
            });
        });
    });
});
