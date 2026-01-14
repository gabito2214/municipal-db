const db = require('./database');
setTimeout(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Tables in database:');
            rows.forEach(row => console.log('- ' + row.name));
        }
        process.exit(0);
    });
}, 1000);
