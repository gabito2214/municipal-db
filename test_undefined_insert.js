const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const sqlDelivery = `INSERT INTO toners (delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// Testing with undefined 'receiver_dni'
const params = ['2023-10-27', 'Test Receiver', undefined, 'Test Pos', 'Test Area', 'HP', 'HP', '85A', 'Juan'];

db.serialize(() => {
    db.run(sqlDelivery, params, function (err) {
        if (err) {
            console.error("INSERT FAILED with undefined:", err.message);
        } else {
            console.log("INSERT SUCCESS with undefined. LastID:", this.lastID);
            // Cleanup
            db.run("DELETE FROM toners WHERE id = ?", [this.lastID]);
        }
        db.close();
    });
});
