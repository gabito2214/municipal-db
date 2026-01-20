const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const data = {
    delivery_date: '2023-10-27',
    receiver_name: 'Test Receiver',
    receiver_dni: '12345678',
    receiver_position: 'Test Position',
    receiver_area: 'Test Area',
    printer_brand: 'HP',
    toner_brand: 'HP',
    toner_model: '85A',
    delivered_by: 'Juan G. Torres'
};

const sqlDelivery = `INSERT INTO toners (delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

db.serialize(() => {
    db.run(sqlDelivery, [
        data.delivery_date,
        data.receiver_name,
        data.receiver_dni,
        data.receiver_position,
        data.receiver_area,
        data.printer_brand,
        data.toner_brand,
        data.toner_model,
        data.delivered_by
    ], function (err) {
        if (err) {
            console.error("INSERT FAILED:", err.message);
        } else {
            console.log("INSERT SUCCESS. LastID:", this.lastID);

            // Cleanup
            db.run("DELETE FROM toners WHERE id = ?", [this.lastID], (err) => {
                if (err) console.error("Cleanup failed");
                else console.log("Cleanup success");
            });
        }
        db.close();
    });
});
