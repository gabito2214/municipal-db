const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE resources ADD COLUMN nomenclature TEXT", (err) => {
        if (err) console.log("Nomenclature column might already exist.");
        else console.log("Added nomenclature column.");
    });
    db.run("ALTER TABLE resources ADD COLUMN ip TEXT", (err) => {
        if (err) console.log("IP column might already exist.");
        else console.log("Added IP column.");
    });
});

db.close();
