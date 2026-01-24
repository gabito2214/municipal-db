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
    db.run("ALTER TABLE resources ADD COLUMN user_name TEXT", (err) => {
        if (err) console.log("User Name column might already exist.");
        else console.log("Added User Name column.");
    });
    db.run("ALTER TABLE resources ADD COLUMN entry_date TEXT", (err) => {
        if (err) console.log("Entry Date column might already exist.");
        else {
            console.log("Added Entry Date column.");
            // Migrar años existentes a fecha completa (01/01/2025)
            db.run("UPDATE resources SET entry_date = entry_year || '-01-01' WHERE entry_date IS NULL AND entry_year IS NOT NULL");
        }
    });
});

db.close();
