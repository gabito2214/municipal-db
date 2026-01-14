const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'municipal.db');
const db = new sqlite3.Database(dbPath);

const inventoryData = [
    { oficina: "Secretaría Privada de Intendencia", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Despacho", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 3 }, // 2 towers, 1 notebook? Image shows 1+2? Let's re-read carefully.
    // Re-reading image: Despacho has 1 tower + 2 towers? Total 3.
    { oficina: "Secretaría de Gobierno y Coordinación de Gabinete", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "Secretaría de Gobierno y Coordinación de Gabinete", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Compras y Suministros", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 5 },
    { oficina: "Compras y Suministros", descripcion: "Bangho", tipo: "Notebook", cantidad: 1 },
    { oficina: "Tesorería", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 5 },
    { oficina: "Tesorería", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Mesa de Entrada", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "Rentas y Ventas", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 4 },
    { oficina: "Personal", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 5 },
    { oficina: "Acción Social", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 2 },
    { oficina: "Desarrollo Humano", descripcion: "Exx", tipo: "Notebook", cantidad: 3 },
    { oficina: "Promoción Social", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "Asesoría Letrada", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "Asesoría Letrada", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Secretaría de Desarrollo", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 4 },
    { oficina: "Secretaría de Desarrollo", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Contaduría", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 7 },
    { oficina: "Industria y Comercio", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "Patrimonio", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Intendencia", descripcion: "Lenovo", tipo: "Notebook", cantidad: 1 },
    { oficina: "Protocolo", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "Prensa", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "Prensa", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 2 },
    { oficina: "Hacienda y Finanzas", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 5 },
    { oficina: "Coordinación de CIC", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Coordinación de CIC", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "Prevención", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 2 },
    { oficina: "Salud", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 5 },
    { oficina: "Informática", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Informática", descripcion: "Mouse, teclado, Monitor (una pantalla)", tipo: "Tower", cantidad: 1 },
    { oficina: "Informática", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 6 },
    { oficina: "Informática", descripcion: "Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Informática", descripcion: "Monitor", tipo: "Servidor", cantidad: 1 },
    { oficina: "Recursos Humanos", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 3 },
    { oficina: "Recursos Humanos", descripcion: "DAEWOO", tipo: "Notebook", cantidad: 1 },
    { oficina: "Infraestructura Personal", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Infraestructura Administrativa", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "Infraestructura Servicios", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 8 },
    { oficina: "Infraestructura Técnica", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 4 },
    { oficina: "Obras Públicas Administración", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 5 },
    { oficina: "Producción y Medio Ambiente", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "Depósito", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Casa de la Cultura", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Casa de la Cultura", descripcion: "Teclado", tipo: "Tower", cantidad: 1 },
    { oficina: "Concejo Deliberante", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 4 },
    { oficina: "Cecoif", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 7 },
    { oficina: "Coordinación de Turismo", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 4 },
    { oficina: "Coordinación de Deportes", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC Huaco", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "CIC Villa Mercedes", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC San Isidro", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 2 },
    { oficina: "CIC Pampa Vieja", descripcion: "Mouse, teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "CIC Pampa Vieja", descripcion: "Teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "CIC Niquivil", descripcion: "Mouse, teclado, Monitor, parlantes", tipo: "Tower", cantidad: 1 },
    { oficina: "CIC Niquivil", descripcion: "Teclado, Monitor", tipo: "Tower", cantidad: 1 },
    { oficina: "Unión Vecinal La Represa", descripcion: "Mouse, teclado, monitor", tipo: "Tower", cantidad: 11 }
];

db.serialize(() => {
    console.log("Reiniciando inventario de informática...");

    // First clear the old resources (optional, but requested each PC one by one)
    db.run("DELETE FROM resources WHERE type IN ('Tower', 'Notebook', 'Servidor', 'Tower (una pantalla)')");

    const stmt = db.prepare("INSERT INTO resources (location, name, type, stock_quantity, nomenclature, ip, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)");

    inventoryData.forEach(item => {
        // Here we expand: add each PC one by one
        for (let i = 0; i < item.cantidad; i++) {
            const pcName = `Equipo ${item.tipo} #${i + 1}`;
            const nomenclature = ""; // Placeholder for user input
            const ip = ""; // Placeholder for user input
            const specs = JSON.stringify({ detalles: item.descripcion });

            stmt.run(item.oficina, pcName, item.tipo, 1, nomenclature, ip, specs);
            console.log(`Agregada: ${item.oficina} - ${pcName}`);
        }
    });

    stmt.finalize();
    console.log("Inventario cargado exitosamente.");
});

db.close();
