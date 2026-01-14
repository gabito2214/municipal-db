async function repro() {
    const baseUrl = 'http://localhost:3000/api';

    // Get all stocks
    const stocks = await (await fetch(`${baseUrl}/toner-stock`)).json();
    console.log("Current Stocks:", stocks);

    const target = stocks.find(s => s.model === '285A');
    if (!target) {
        console.log("Model 285A not found. Creating it...");
        await fetch(`${baseUrl}/toner-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: '285A', quantity: 5, description: 'Test' })
        });
        return repro();
    }

    console.log("Attempting to update 285A (ID " + target.id + ")...");
    const res = await fetch(`${baseUrl}/toner-stock/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: '285A',
            quantity: 5,
            description: 'Office'
        })
    });

    const data = await res.json();
    console.log("Response:", res.status, data);
}

repro().catch(console.error);
