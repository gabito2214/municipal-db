const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('./database');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Helper: Hash Password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// === API ROUTES ===

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const hashed = hashPassword(password);

    db.get("SELECT * FROM users WHERE username = ? AND password_hash = ?", [username, hashed], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user) {
            // In a real app, generate a JWT token here.
            // For simplicity, we just return success and user info.
            res.json({ success: true, user: { id: user.id, username: user.username, role: user.role_id } });
        } else {
            res.status(401).json({ success: false, message: "Credenciales inválidas" });
        }
    });
});

// GET Projects
app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET Resources (Inventory)
app.get('/api/resources', (req, res) => {
    db.all("SELECT * FROM resources ORDER BY location ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE Project
app.post('/api/projects', (req, res) => {
    const { name, status, budget, custom } = req.body;
    const customJSON = JSON.stringify(custom || {});
    const sql = "INSERT INTO projects (name, status, budget, custom_attributes) VALUES (?, ?, ?, ?)";

    db.run(sql, [name, status, budget, customJSON], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

// UPDATE Project (Dynamic Field Add)
app.put('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    const { name, status, budget, custom } = req.body;

    // First get existing to keep data integrity if fields are missing
    db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Not found" });

        const newName = name || row.name;
        const newStatus = status || row.status;
        const newBudget = budget !== undefined ? budget : row.budget;

        let existingCustom = JSON.parse(row.custom_attributes || '{}');
        let updatedCustom = custom ? { ...existingCustom, ...custom } : existingCustom;

        db.run(
            "UPDATE projects SET name = ?, status = ?, budget = ?, custom_attributes = ? WHERE id = ?",
            [newName, newStatus, newBudget, JSON.stringify(updatedCustom), id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            }
        );
    });
});

// DELETE Project
app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM projects WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// UPLOAD Invoice
app.post('/api/projects/:id/invoices', (req, res) => {
    const { id } = req.params;
    const { image, name } = req.body; // Base64 image

    if (!image) return res.status(400).json({ error: 'No image data' });

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid image data' });
    }

    const ext = matches[1].split('/')[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `invoice_${id}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFile(filepath, buffer, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update DB
        db.get("SELECT custom_attributes FROM projects WHERE id = ?", [id], (err, row) => {
            if (err || !row) return res.status(404).json({ error: "Project not found" });

            let custom = JSON.parse(row.custom_attributes || '{}');
            if (!custom.invoices) custom.invoices = [];

            // Limit to 10
            if (custom.invoices.length >= 10) return res.status(400).json({ error: "Limit of 10 invoices reached" });

            custom.invoices.push(`/uploads/${filename}`);

            db.run("UPDATE projects SET custom_attributes = ? WHERE id = ?", [JSON.stringify(custom), id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, url: `/uploads/${filename}` });
            });
        });
    });
});

// UPDATE Resource (Inventory IT)
app.put('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    const { location, type, nomenclature, ip, specifications } = req.body;

    const sql = "UPDATE resources SET location = ?, type = ?, nomenclature = ?, ip = ?, specifications = ? WHERE id = ?";
    const specsJSON = typeof specifications === 'string' ? specifications : JSON.stringify(specifications || {});

    db.run(sql, [location, type, nomenclature, ip, specsJSON, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Resource not found" });
        res.json({ success: true });
    });
});

// CREATE Resource (Inventory IT)
app.post('/api/resources', (req, res) => {
    const { location, type, nomenclature, ip, specifications } = req.body;
    const sql = "INSERT INTO resources (location, type, name, nomenclature, ip, specifications, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const specsJSON = typeof specifications === 'string' ? specifications : JSON.stringify(specifications || {});
    const name = `Equipo ${type || 'Nuevo'}`;

    db.run(sql, [location || 'Pendiente', type || 'Nuevo', name, nomenclature || '', ip || '', specsJSON, 1], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, success: true });
    });
});

// DELETE Resource
app.delete('/api/resources/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM resources WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// === TONERS API ===

// GET Toners
app.get('/api/toners', (req, res) => {
    db.all("SELECT * FROM toners ORDER BY delivery_date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE Toner Delivery (Subtracts from stock)
app.post('/api/toners', (req, res) => {
    const { delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by } = req.body;

    db.serialize(() => {
        const sqlDelivery = `INSERT INTO toners (delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sqlDelivery, [delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const deliveryId = this.lastID;

            // Decrement Stock
            const updateStockSql = "UPDATE toner_stock SET quantity = quantity - 1 WHERE model = ?";
            db.run(updateStockSql, [toner_model], function (err) {
                if (err) {
                    console.error("Error updating stock:", err.message);
                }
                res.json({ id: deliveryId, success: true, stock_updated: this.changes > 0 });
            });
        });
    });
});

// === TONER STOCK API ===

// GET Toner Stock
app.get('/api/toner-stock', (req, res) => {
    db.all("SELECT * FROM toner_stock ORDER BY model ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE/UPDATE Toner Stock (Restock)
app.post('/api/toner-stock', (req, res) => {
    const { model, quantity, description } = req.body;

    // Upsert logic
    db.get("SELECT id FROM toner_stock WHERE model = ?", [model], (err, row) => {
        if (err) {
            console.error("Error checking toner stock:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            const sql = "UPDATE toner_stock SET quantity = quantity + ?, description = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?";
            db.run(sql, [quantity, description, row.id], function (err) {
                if (err) {
                    console.error("Error updating (restock) toner stock:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, updated: true });
            });
        } else {
            const sql = "INSERT INTO toner_stock (model, quantity, description) VALUES (?, ?, ?)";
            db.run(sql, [model, quantity, description], function (err) {
                if (err) {
                    console.error("Error inserting toner stock:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ success: true, inserted: true, id: this.lastID });
            });
        }
    });
});

// DELETE Toner Stock entry
app.delete('/api/toner-stock/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM toner_stock WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// UPDATE Toner Stock entry
app.put('/api/toner-stock/:id', (req, res) => {
    const { id } = req.params;
    const { model, quantity, description } = req.body;

    console.log(`Updating toner stock ID ${id}: model="${model}", qty=${quantity}`);

    const sql = "UPDATE toner_stock SET model = ?, quantity = ?, description = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [model, quantity, description, id], function (err) {
        if (err) {
            console.error("Error updating toner stock:", err.message);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: "Stock entry not found" });
        res.json({ success: true });
    });
});

// UPDATE Toner Delivery
app.put('/api/toners/:id', (req, res) => {
    const { id } = req.params;
    const { delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by } = req.body;

    db.get("SELECT toner_model FROM toners WHERE id = ?", [id], (err, oldRecord) => {
        if (err || !oldRecord) return res.status(404).json({ error: "Record not found" });

        const sql = `UPDATE toners SET delivery_date = ?, receiver_name = ?, receiver_dni = ?, receiver_position = ?, receiver_area = ?, printer_brand = ?, toner_brand = ?, toner_model = ?, delivered_by = ? 
                     WHERE id = ?`;

        db.run(sql, [delivery_date, receiver_name, receiver_dni, receiver_position, receiver_area, printer_brand, toner_brand, toner_model, delivered_by, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (oldRecord.toner_model !== toner_model) {
                // Restore old
                db.run("UPDATE toner_stock SET quantity = quantity + 1 WHERE model = ?", [oldRecord.toner_model], (err) => {
                    // Subtract new
                    db.run("UPDATE toner_stock SET quantity = quantity - 1 WHERE model = ?", [toner_model], (err) => {
                        res.json({ success: true });
                    });
                });
            } else {
                res.json({ success: true });
            }
        });
    });
});

// DELETE Toner Delivery
app.delete('/api/toners/:id', (req, res) => {
    const { id } = req.params;

    db.get("SELECT toner_model FROM toners WHERE id = ?", [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Record not found" });

        const model = row.toner_model;

        db.run("DELETE FROM toners WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Restore stock
            db.run("UPDATE toner_stock SET quantity = quantity + 1 WHERE model = ?", [model], (err) => {
                if (err) {
                    console.error("Error restoring stock after toner delivery deletion:", err.message);
                    // Decide how to handle this error. For now, we'll still respond success for the delivery deletion.
                }
                res.json({ success: true, deleted: this.changes });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Usuario: Sistemas | Pass: J.Grillo`);
});
