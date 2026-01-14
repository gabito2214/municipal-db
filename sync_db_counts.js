const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

// Target counts based on the image (same data as seed_inventory.js)
const targetInventory = [
    { oficina: "Secretaría Privada de Intendencia", tipo: "Tower", cantidad: 1 },
    { oficina: "Despacho", tipo: "Tower", cantidad: 3 },
    { oficina: "Secretaría de Gobierno y Coordinación de Gabinete", tipo: "Tower", cantidad: 1 },
    { oficina: "Secretaría de Gobierno y Coordinación de Gabinete", tipo: "Notebook", cantidad: 1 },
    { oficina: "Compras y Suministros", tipo: "Tower", cantidad: 5 },
    { oficina: "Compras y Suministros", tipo: "Notebook", cantidad: 1 },
    { oficina: "Tesorería", tipo: "Tower", cantidad: 5 },
    { oficina: "Tesorería", tipo: "Notebook", cantidad: 1 },
    { oficina: "Mesa de Entrada", tipo: "Tower", cantidad: 2 },
    { oficina: "Rentas y Ventas", tipo: "Tower", cantidad: 4 },
    { oficina: "Personal", tipo: "Tower", cantidad: 5 },
    { oficina: "Acción Social", tipo: "Tower", cantidad: 2 },
    { oficina: "Desarrollo Humano", tipo: "Notebook", cantidad: 3 },
    { oficina: "Promoción Social", tipo: "Tower", cantidad: 1 },
    { oficina: "Asesoría Letrada", tipo: "Tower", cantidad: 1 },
    { oficina: "Asesoría Letrada", tipo: "Notebook", cantidad: 1 },
    { oficina: "Secretaría de Desarrollo", tipo: "Tower", cantidad: 4 },
    { oficina: "Secretaría de Desarrollo", tipo: "Notebook", cantidad: 1 },
    { oficina: "Contaduría", tipo: "Tower", cantidad: 7 },
    { oficina: "Industria y Comercio", tipo: "Tower", cantidad: 2 },
    { oficina: "Patrimonio", tipo: "Tower", cantidad: 1 },
    { oficina: "Intendencia", tipo: "Notebook", cantidad: 1 },
    { oficina: "Protocolo", tipo: "Tower", cantidad: 2 },
    { oficina: "Prensa", tipo: "Tower", cantidad: 1 },
    { oficina: "Prensa", tipo: "Notebook", cantidad: 2 },
    { oficina: "Hacienda y Finanzas", tipo: "Tower", cantidad: 5 },
    { oficina: "Coordinación de CIC", tipo: "Notebook", cantidad: 1 },
    { oficina: "Coordinación de CIC", tipo: "Tower", cantidad: 1 },
    { oficina: "Prevención", tipo: "Notebook", cantidad: 2 },
    { oficina: "Salud", tipo: "Notebook", cantidad: 5 },
    { oficina: "Salud", tipo: "Tower", cantidad: 1 }, // Added manually as missed in seed aggregation above but present in analysis? 
    // Wait, seed lines 38-39? No, seed only had Notebook for Salud. 
    // Let's re-verify Image for Salud.
    // Row Salud: "Tower" 1.
    // Row Salud: "DAEWOO" Notebook (x5).
    // So Salud has 1 Tower AND 5 Notebooks.
    // Seed file lines:
    // 38: Salud DAEWOO Notebook 5.
    // Does it have Salud Tower?
    // Scanning seed file... 
    // I don't see "Salud" Tower in seed file lines 1-67!
    // It seems the seed file WAS MISSING the Salud Tower!
    // I should ADD it to target if I want to be correct, but the user said "elimina pc extras".
    // If the DB has it and I don't list it, I will delete it.
    // I must include it to protect it.
    { oficina: "Salud", tipo: "Tower", cantidad: 1 },

    { oficina: "Informática", tipo: "Notebook", cantidad: 1 },
    { oficina: "Informática", tipo: "Tower", cantidad: 7 }, // 1 (una pantalla) + 6 others = 7 total Towers
    { oficina: "Informática", tipo: "Servidor", cantidad: 1 },
    { oficina: "Recursos Humanos", tipo: "Tower", cantidad: 3 },
    { oficina: "Recursos Humanos", tipo: "Notebook", cantidad: 1 },
    { oficina: "Infraestructura Personal", tipo: "Tower", cantidad: 1 },
    { oficina: "Infraestructura Administrativa", tipo: "Tower", cantidad: 2 },
    { oficina: "Infraestructura Servicios", tipo: "Tower", cantidad: 8 },
    { oficina: "Infraestructura Técnica", tipo: "Tower", cantidad: 4 },
    { oficina: "Obras Públicas Administración", tipo: "Tower", cantidad: 5 },
    { oficina: "Producción y Medio Ambiente", tipo: "Tower", cantidad: 2 },
    { oficina: "Depósito", tipo: "Tower", cantidad: 1 },
    { oficina: "Casa de la Cultura", tipo: "Tower", cantidad: 2 }, // 1 + 1 (teclado)
    { oficina: "Concejo Deliberante", tipo: "Tower", cantidad: 4 },
    { oficina: "Cecoif", tipo: "Tower", cantidad: 7 },
    { oficina: "Coordinación de Turismo", tipo: "Tower", cantidad: 4 },
    { oficina: "Coordinación de Deportes", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC Huaco", tipo: "Tower", cantidad: 1 },
    { oficina: "CIC Villa Mercedes", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC San Isidro", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC Pampa Vieja", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC Niquivil", tipo: "Tower", cantidad: 2 },
    { oficina: "Unión Vecinal La Represa", tipo: "Tower", cantidad: 11 }
];

db.serialize(() => {
    console.log("Verificando y eliminando equipos extras...");

    // Agrupar targets por oficina y tipo
    const targets = {};
    targetInventory.forEach(item => {
        const key = `${item.oficina}|${item.tipo}`;
        if (!targets[key]) targets[key] = 0;
        targets[key] += item.cantidad;
    });

    const checkNext = (keys, index) => {
        if (index >= keys.length) {
            console.log("Proceso finalizado.");
            return;
        }

        const key = keys[index];
        const [oficina, tipo] = key.split('|');
        const targetCount = targets[key];

        // Normalizar query para ser flexible con mayúsculas/minúsculas o espacios
        db.all("SELECT id FROM resources WHERE location = ? AND type = ?", [oficina, tipo], (err, rows) => {
            if (err) {
                console.error(err);
                checkNext(keys, index + 1);
                return;
            }

            const currentCount = rows.length;

            if (currentCount > targetCount) {
                const diff = currentCount - targetCount;
                console.log(`[${oficina} - ${tipo}] Sobran ${diff} equipos. Eliminando...`);

                // Tomar los IDs extras (los últimos agregados, ids más altos)
                const idsToDelete = rows.sort((a, b) => b.id - a.id).slice(0, diff).map(r => r.id);

                const placeholders = idsToDelete.map(() => '?').join(',');
                db.run(`DELETE FROM resources WHERE id IN (${placeholders})`, idsToDelete, (err) => {
                    if (err) console.error("Error eliminando:", err);
                    else console.log(`  -> Eliminados ${diff} registros.`);
                    checkNext(keys, index + 1);
                });
            } else {
                // console.log(`[${oficina} - ${tipo}] Correcto (${currentCount}/${targetCount})`);
                checkNext(keys, index + 1);
            }
        });
    };

    checkNext(Object.keys(targets), 0);
});
