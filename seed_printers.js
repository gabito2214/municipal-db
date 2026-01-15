const db = require('./database');

const printers = [
    { sector: "Coordinación de Gabinete", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Coordinación de Gabinete", marca: "HP", modelo: "Laserjet P1102w", detalle: "desuso" },
    { sector: "Asesoría Letrada", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Asesoría Letrada", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "desuso" },
    { sector: "Compras", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Contaduría", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Contaduría", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Contaduría", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Despacho", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Tesorería", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Tesorería", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Mesa de Entrada", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Acción Social", marca: "HP", modelo: "Laserjet PRO M12w", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet PRO M15w", detalle: "" },
    { sector: "Rentas", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Recursos Humanos", marca: "Samsung", modelo: "ML-2165w", detalle: "" },
    { sector: "Industria y Comercio", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Industria y Comercio", marca: "Ricoh", modelo: "M 320", detalle: "" },
    { sector: "Secretaría de Desarrollo Humano", marca: "HP", modelo: "Laserjet PRO MFP M130fdw", detalle: "" },
    { sector: "Secretaría de Desarrollo Humano", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Empleo", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Empleo", marca: "HP", modelo: "Laserjet P102w", detalle: "" },
    { sector: "Coordinación de CIC", marca: "HP", modelo: "Laserjet P102w", detalle: "" },
    { sector: "Coordinación de Higiene y", marca: "HP", modelo: "Laserjet P1102w", detalle: "" }, // Likely 'Seguridad' clipped or just HyS
    { sector: "Hacienda", marca: "HP", modelo: "Laserjet PRO M12w", detalle: "" },
    { sector: "Hacienda", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Protocolo", marca: "Epson", modelo: "L3150", detalle: "" },
    { sector: "Prensa", marca: "Epson", modelo: "L14150", detalle: "" },
    { sector: "Secretaría Intendencia", marca: "Samsung", modelo: "M2020", detalle: "" },
    { sector: "Informática", marca: "Samsung", modelo: "ML-2165W", detalle: "" },
    { sector: "Informática", marca: "Pantum", modelo: "P 33000W", detalle: "" },
    { sector: "Informática", marca: "Pantum", modelo: "pm6509W", detalle: "" },
    { sector: "Informática", marca: "Epson", modelo: "3550", detalle: "" },
    { sector: "Patrimonial", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Salud", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Infraestructura Personal", marca: "HP", modelo: "Laser Jet Pro M15w", detalle: "" },
    { sector: "Infraestructura Administrativa", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Infraestructura Administrativa", marca: "HP", modelo: "Laser Jet P1006", detalle: "" },
    { sector: "Infraestructura Servicios", marca: "HP", modelo: "Laser Jet Pro MFP428 fdw", detalle: "" },
    { sector: "Infraestructura Técnica", marca: "HP", modelo: "Laser Jet Pro 1102w", detalle: "" },
    { sector: "Infraestructura Técnica", marca: "HP", modelo: "Design Jet t250", detalle: "" }, // Corrected Typo
    { sector: "Obras Públicas Administración", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Obras Públicas Administración", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Obras Públicas área técnica", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Producción y Medio Ambiente", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Depósito", marca: "HP", modelo: "Laser Jet 1006", detalle: "" },
    // Ciudad de los Niños - Empty in image or headers? Assume empty row in image means header or skip. 
    // Image has "Ciudad de los Niños" under Sector, but Marca/Modelo empty. Skipping.
    { sector: "Casa de la Cultura", marca: "Brother", modelo: "HL-2130", detalle: "" },
    { sector: "Concejo Deliberante", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Concejo Deliberante", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Cecoif", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Coordinación de Turismo", marca: "HP", modelo: "Laser Jet P102W", detalle: "" },
    { sector: "Coordinación de Turismo", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Coordinación de deportes", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Coordinación de deportes", marca: "Brother", modelo: "Laser LGL LTR", detalle: "" },
    { sector: "CIC Huaco", marca: "HP", modelo: "Laser Jet 1006", detalle: "" },
    { sector: "CIC Villa Mercedes", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC San Isidro", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC Pampa Vieja", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC Niquivil", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "Unión Vecinal La Represa", marca: "HP", modelo: "Laser Jet 1006", detalle: "desuso" }
];

db.serialize(() => {
    console.log("Cargando inventario de Impresoras...");

    db.run("DELETE FROM resources WHERE type = 'Impresora'", [], () => {
        printers.forEach(p => {
            const name = `${p.marca} ${p.modelo}`;
            const specs = JSON.stringify({
                marca: p.marca,
                modelo: p.modelo,
                detalles: p.detalle
            });

            db.run("INSERT INTO resources (location, name, type, stock_quantity, nomenclature, ip, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [p.sector, name, 'Impresora', 1, '', '', specs], (err) => {
                    if (err) console.error(`Error agregando impresora ${name}:`, err.message);
                });
        });
        console.log(`Carga de impresoras solicitada.`);
    });
});
