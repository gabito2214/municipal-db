const db = require('./database');

const rawData = [
    { oficina: "Despacho", desc: "switch TP-link 8 puertos" },
    { oficina: "Secretaría de Gobierno y", desc: "switch TP-link 8 puertos" },
    { oficina: "compras y suministros", desc: "switch TP-link 8 puertos" },
    { oficina: "Tesorería", desc: "switch TP-link 8 puertos, chancleta, router mercusis" },
    { oficina: "Mesa de Entrada", desc: "Switch Tp- link 5 puertos" },
    { oficina: "Rentas y ventas", desc: "switch TP-link 8 puertos" },
    { oficina: "Personal", desc: "switch 5 y 8 puertos, AP AC MESH unifi" },
    { oficina: "Acción Social", desc: "Camara de Seguridad, switch TP-Link 5 Puertos" },
    // Desarrollo Humano empty
    { oficina: "Promoción Social", desc: "switch TP-Link 8 Puertos" },
    { oficina: "Asesoría Letrada", desc: "Switch TP-Link 5 puertos, estabilisador" },
    { oficina: "Secretaría de Desarrollo Humano y", desc: "Switch TP-Link 5 puertos, router tp-Link 300MB" },
    { oficina: "Contaduría", desc: "2 switch TP-Link 8 puertos" }, // Special case "2 switch"
    { oficina: "Industria y Comercio", desc: "Router tp link," },
    { oficina: "Patrimonio", desc: "switch TP-link 8 puertos" },
    { oficina: "Despacho", desc: "" }, // Duplicate key, assume second row in image meant distinct? Image has headers repeated? 
    // Wait, Image shows lists. Let's look closer.
    // "Patrimonio" -> "switch...". Next row "Despacho"? 
    // Ah, table seems to restart or have multiple sections?
    // "Secretaría de Intendencia" -> "router mercusis".
    { oficina: "Secretaría de Intendencia", desc: "router mercusis" },
    { oficina: "Protocolo", desc: "Switch GCL Tec 8 puertos, chancleta" },
    { oficina: "Prensa", desc: "Switch TP-link 8 puertos, 3 chancletas, router mercusis" },
    { oficina: "Hacienda y Finanzas", desc: "Switch Cisco 8 Puertos" },
    // Coordinacion de CIC empty
    { oficina: "Patrimonial", desc: "Switch TP-Link 5 puertos" },
    { oficina: "Salud", desc: "router mercusis" },
    { oficina: "Informática", desc: "2 ups, switch TP-link 24 puertos, Ap AC PRO unifi, microtik TP-Link, 2 chancletas, 1 estabilizador" },
    { oficina: "Intendencia", desc: "switch TP-Link 5 puertos, router TP-Link, chancleta, AP AC MESH unifi" },
    { oficina: "Infraestructura personal", desc: "switch TP-link 8 puertos" },
    { oficina: "Infraestructura administracion", desc: "switch TP-link 8 puertos" }, // Image merges cells? Let's assume shared line.
    { oficina: "Infraestructura servicios", desc: "Switch TP-Link 5 puertos" },
    { oficina: "Infraestructura Técnica", desc: "Switch TP-Link 5 puertos, router tenda , 3 estabilizadores" },
    { oficina: "Obras Públicas Administración", desc: "switchTP-link 5 Puertos, router TP-Link, chancleta, estabilizador" },
    { oficina: "Producción y Medio Ambiente", desc: "Switch Tp Link 5 puertos, router Mercusis, chancleta" },
    { oficina: "Depósito", desc: "Switch TP-Link 5 puertos, router mercusis" },
    { oficina: "Empleo", desc: "AP AC tp link, switch TP-Link 8 Puertos" },
    { oficina: "Defensa al Consumidor", desc: "Switch TP-Link 5 puertos" },
    // Casa de Jachal, Coordinacion de Turismo, etc.
    { oficina: "Cabañas Municipales", desc: "AP AC PRO unifi, router Mercusis" },
    { oficina: "Coordinación de Turismo", desc: "2 Switch TP-Link 5 Puertos, router Nex, AP unifi, router mercusis" },
    { oficina: "Coordinación de Deportes", desc: "switch TP-Link 5 Puertos" },
    { oficina: "CIC Huaco", desc: "AP AC PRO unifi, router Mercusis, switch TP-Link 5 Puertos" },
    { oficina: "CIC Villa Mercedes", desc: "AP AC PRO unifi, router Mercusis, switch TP-Link 5 Puertos" },
    { oficina: "CIC San Isidro", desc: "AP AC PRO unifi, router Mercusis, switch TP-Link 5 Puertos" }, // Image says "AP AC PRO unifi, router Mercusis, switch TP-Link 5 Puertos"
    { oficina: "CIC Pampa Vieja", desc: "AP AC PRO unifi, router Mercusis, switch TP-Link 5 Puertos, antena Starlink" },
    { oficina: "CIC Niquivil", desc: "switch TP-Link 8 Puertos" },
    { oficina: "Cecoif", desc: "AP AC PRO unifi, router Mercusis, AP AC MESH unifi" },
    { oficina: "Policía", desc: "router Hitvision" },
    { oficina: "Turismo Baños", desc: "AP AC MESH unifi, router mercusis" },
    { oficina: "Vivero", desc: "AP AC MESH unifi" },
    { oficina: "Cabañas", desc: "router mercusis" },
    { oficina: "Patrulla Municipal", desc: "antena Starlink" }
];

db.serialize(() => {
    console.log("Cargando inventario de Redes...");

    db.run("DELETE FROM resources WHERE type = 'Redes'", [], () => {
        rawData.forEach(row => {
            if (!row.desc) return;

            const items = row.desc.split(',').map(s => s.trim()).filter(s => s);

            items.forEach(item => {
                let quantity = 1;
                let description = item;

                const match = item.match(/^(\d+)\s+(.+)$/);
                if (match) {
                    quantity = parseInt(match[1]);
                    description = match[2];
                }

                for (let i = 0; i < quantity; i++) {
                    const specs = JSON.stringify({ detalles: description });
                    const name = description;
                    db.run("INSERT INTO resources (location, name, type, stock_quantity, nomenclature, ip, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [row.oficina, name, 'Redes', 1, '', '', specs], (err) => {
                            if (err) console.error(`Error agregando red en ${row.oficina}:`, err.message);
                        });
                }
            });
        });
        console.log("Inventario de redes cargado.");
    });
});
