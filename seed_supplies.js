const db = require('./database');

const supplies = [
    { cant: 3, desc: "Gabinetes" },
    { cant: 4, desc: "Camaras" },
    { cant: 1, desc: "Taladro" },
    { cant: 2, desc: "Tarjetas de Memoria DDR 3" },
    { cant: 2, desc: "Placas Madre" },
    { cant: 4, desc: "Impresoras (no funcionan)" },
    { cant: 1, desc: "Ups" },
    { cant: 3, desc: "Air fiber" },
    { cant: 6, desc: "Fuentes de Alimentacion (2 no funcionan)" },
    { cant: 6, desc: "Switch (uno no funciona)" },
    { cant: 1, desc: "Impresora (en Of. Despacho)", location: "Despacho" }, // Exception
    { cant: 1, desc: "etiquetadora" },
    { cant: 1, desc: "desatornilladora" },
    { cant: 1, desc: "escalera" },
    { cant: 1, desc: "Flow Jore Switch" }, // Text recognition might be 'Floor'? 'Flow Jore'? copy exact. 'Flow Jore Switch'
    { cant: 2, desc: "Router tende" }, // Tenda? Copy exact per image or fix? 'tende' -> 'Tenda' likely.
    { cant: 2, desc: "router TP-Link" },
    { cant: 5, desc: "PC desuso( Actualizar)" },
    { cant: 3, desc: "UPS a recargar" },
    { cant: 1, desc: "organizador de cable rack" },
    { cant: 2, desc: "SSD (uno no funciona)" },
    { cant: 2, desc: "AP tp-link de esteriores" },
    { cant: 7, desc: "Ap AC PRO unifi" },
    { cant: 8, desc: "AP AC MESH unifi" },
    { cant: 3, desc: "Teclado ( 2 no funcionan)" },
    { cant: 1, desc: "Caja estanco IP65" },
    { cant: 1, desc: "Manta Antiestatica" },
    { cant: 1, desc: "Microprocesador en Revision" },
    { cant: 0, desc: "Chancleta" },
    { cant: 1, desc: "Monitor VGA/HDMI" },
    { cant: 2, desc: "kit de destornilladores de Presicion" }
];

db.serialize(() => {
    console.log("Cargando Stock de Insumos...");

    db.run("DELETE FROM resources WHERE type = 'Insumo'", [], () => {
        supplies.forEach(s => {
            if (s.cant === 0) return;

            const loc = s.location || "Depósito";
            db.run("INSERT INTO resources (location, name, type, stock_quantity, nomenclature, ip, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [loc, s.desc, 'Insumo', s.cant, '', '', '{}'], (err) => {
                    if (err) console.error(`Error agregando insumo ${s.desc}:`, err.message);
                });
        });
        console.log("Stock de Insumos cargado.");
    });
});
