const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const updates = [
    { old: "Secretaría de Gobierno y", new: "Secretaría de Gobierno y Coordinación de Gabinete" },
    { old: "Secretaría de Desarrollo Humano y", new: "Secretaría de Desarrollo Humano y Acción Social" },
    { old: "Coordinación de Higiene y", new: "Coordinación de Higiene y Seguridad" },
    { old: "Hacienda", new: "Hacienda y Finanzas" },
    { old: "Hacienda y Finansas", new: "Hacienda y Finanzas" }, // Just in case
];

db.serialize(() => {
    console.log("Corrigiendo nombres de oficinas...");

    const stmt = db.prepare("UPDATE resources SET location = ? WHERE location LIKE ?");

    updates.forEach(u => {
        // Use LIKE to match strict or potentially slightly different if whitespace issues
        // But strict match is safer for replacements. 
        // Let's use exact match first.
        db.run("UPDATE resources SET location = ? WHERE location = ?", [u.new, u.old], function (err) {
            if (err) console.error(err);
            if (this.changes > 0) console.log(`Actualizado: '${u.old}' -> '${u.new}' (${this.changes} registros)`);
        });
    });

    stmt.finalize();
});

db.close();
