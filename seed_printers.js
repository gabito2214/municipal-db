const db = require('./database');

const printers = [
    { sector: "Coordinacion de Gabinete y", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Coordinacion de Gabinete y", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Acesoria Letrada", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Acesoria Letrada", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Compras", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Contaduria", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Contaduria", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Contaduria", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Despacho", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Tesoreria", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Tesoreria", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Mesa de Entrada", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Accion Social", marca: "HP", modelo: "Laserjet PRO M12w", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet PRO MFP 1006", detalle: "" },
    { sector: "Personal", marca: "HP", modelo: "Laserjet PRO M15w", detalle: "" },
    { sector: "Rentas", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Recursos Humanos", marca: "Samsung", modelo: "ML-2165w", detalle: "" },
    { sector: "Industria y Comercio", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Industria y Comercio", marca: "Ricoh", modelo: "M.320", detalle: "" },
    { sector: "Secretaria de Desarrollo Humano", marca: "HP", modelo: "Laserjet PRO MFP M130fdw", detalle: "" },
    { sector: "Secretaria de Desarrollo Humano", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Empleo", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Empleo", marca: "HP", modelo: "Laserjet P102w", detalle: "" },
    { sector: "Coordinacion de CIC", marca: "HP", modelo: "Laserjet P102w", detalle: "" },
    { sector: "Coordinacion de Higiene y", marca: "HP", modelo: "Laserjet P1102w", detalle: "" },
    { sector: "Hacienda", marca: "HP", modelo: "Laserjet PRO M12w", detalle: "" },
    { sector: "Hacienda", marca: "HP", modelo: "Laserjet PRO MFP M428fdw", detalle: "" },
    { sector: "Protocolo", marca: "Epson", modelo: "L3150", detalle: "" },
    { sector: "Prensa", marca: "Epson", modelo: "L14150", detalle: "" },
    { sector: "Secretaria Intendencia", marca: "Samsung", modelo: "M2020", detalle: "" },
    { sector: "Informatica", marca: "Samsung", modelo: "ML-2165W", detalle: "" },
    { sector: "Informatica", marca: "Pantum", modelo: "P 33000W", detalle: "" },
    { sector: "Informatica", marca: "Pantum", modelo: "pm6509W", detalle: "" },
    { sector: "Informatica", marca: "Epson", modelo: "3550", detalle: "" },
    { sector: "Patrimonial", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Salud", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Infraestructura personal", marca: "HP", modelo: "Laser Jet Pro M15w", detalle: "" },
    { sector: "Infraestructura Administracion", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Infraestructura Administracion", marca: "HP", modelo: "Laser Jet P1006", detalle: "" },
    { sector: "Infraestructura Servicios", marca: "HP", modelo: "Laser Jet Pro MFP428 fdw", detalle: "" },
    { sector: "Infraestructura Tecnica", marca: "HP", modelo: "Laser Jet Pro 1102w", detalle: "" },
    { sector: "Infraestructura Tecnica", marca: "HP", modelo: "Desing Jet t250", detalle: "" },
    { sector: "Obras Publicas Administracion", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Obras Publicas Administracion", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Obras Publicas area tecnica", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Produccion y Medio Ambiente", marca: "Brother", modelo: "HL-2130 Laser Printer", detalle: "" },
    { sector: "Deposito", marca: "HP", modelo: "Laser Jet 1006", detalle: "" },
    { sector: "Casa de la Cultura", marca: "Brother", modelo: "HL-2130", detalle: "" },
    { sector: "Concejo Deliverante", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Concejo Deliverante", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Cecoif", marca: "HP", modelo: "Laser 107w", detalle: "" },
    { sector: "Coordinacion de Turismo", marca: "HP", modelo: "Laser Jet P102W", detalle: "" },
    { sector: "Coordinacion de Turismo", marca: "Brother", modelo: "HL-1110", detalle: "" },
    { sector: "Coordinacion de deportes", marca: "HP", modelo: "Laserjet PRO MFP M4103fdw", detalle: "" },
    { sector: "Coordinacion de deportes", marca: "Brother", modelo: "Laser LGL LTR", detalle: "" },
    { sector: "CIC Huaco", marca: "HP", modelo: "Laser Jet 1006", detalle: "" },
    { sector: "CIC Villa Mercedes", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC San Isidro", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC Pampa Vieja", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "CIC Niquivil", marca: "HP", modelo: "Laser Jet P1102w", detalle: "" },
    { sector: "Union Vecinal la Represa", marca: "HP", modelo: "Laser Jet 1006", detalle: "" }
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
