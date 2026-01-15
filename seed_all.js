const { execSync } = require('child_process');

console.log("=== Iniciando Carga Masiva de Datos ===");

const scripts = [
    'seed_inventory.js',
    'seed_networks.js',
    'seed_printers.js',
    'seed_supplies.js'
];

scripts.forEach(script => {
    console.log(`\nEjecutando ${script}...`);
    try {
        const output = execSync(`node ${script}`, { encoding: 'utf-8' });
        console.log(output);
    } catch (error) {
        console.error(`Error en ${script}:`, error.message);
    }
});

console.log("\n=== Proceso de Carga Finalizado ===");
