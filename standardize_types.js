const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("UPDATE resources SET type = 'Tower' WHERE type = 'Tower (una pantalla)'", function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log(`Updated ${this.changes} records.`);
        }
    });
});

db.close();
