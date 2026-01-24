const db = require('./database');

const ewasteData = [
    { name: "Monitor", qty: 5 },
    { name: "Teclados", qty: 7 },
    { name: "Mouses", qty: 5 },
    { name: "Gabinetes", qty: 15 },
    { name: "Placas madre", qty: 11 },
    { name: "Lectoras DVD", qty: 8 },
    { name: "RAM", qty: 12 },
    { name: "Impresoras", qty: 11 },
    { name: "router", qty: 3 },
    { name: "discos rigidos", qty: 21 },
    { name: "Toner", qty: 400 }
];

db.serialize(() => {
    console.log("Cargando Inventario de Basura Tecnológica...");

    db.run("DELETE FROM resources WHERE type = 'Basura'", [], () => {
        ewasteData.forEach(item => {
            const specs = JSON.stringify({ detalles: "Residuo Electrónico" });
            db.run("INSERT INTO resources (location, name, type, stock_quantity, specifications) VALUES (?, ?, ?, ?, ?)",
                ['Depósito RAEE', item.name, 'Basura', item.qty, specs], (err) => {
                    if (err) console.error(`Error agregando ${item.name}:`, err.message);
                });
        });
        console.log("Basura Tecnológica cargada con éxito.");
    });
});
