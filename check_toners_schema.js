const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(toners)", (err, rows) => {
    if (err) {
        console.error("Error getting schema:", err);
    } else {
        console.log("Schema for 'toners' table:");
        console.table(rows);
    }
    db.close();
});
