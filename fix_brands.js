const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT id, specifications FROM resources", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        const stmt = db.prepare("UPDATE resources SET specifications = ? WHERE id = ?");
        rows.forEach(row => {
            if (row.specifications && row.specifications.includes('DABWOD')) {
                const updatedSpecs = row.specifications.replace(/DABWOD/g, 'DAEWOO');
                stmt.run(updatedSpecs, row.id);
                console.log(`Updated row ID ${row.id}`);
            }
        });
        stmt.finalize();
        console.log("Database brands corrected.");
    });
});

db.close();
