const http = require('http');

const data = JSON.stringify({
    model: 'TEST-MODEL-' + Date.now(),
    quantity: 5,
    description: 'Test description'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/toner-stock',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error('Request error:', error);
});

req.write(data);
req.end();
