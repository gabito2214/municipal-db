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

// Debug Logging
console.log("=== SERVER STARTUP ===");
console.log(`Node Version: ${process.version}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT ENV: ${process.env.PORT}`);
console.log(`DATABASE_URL Present: ${!!process.env.DATABASE_URL}`);

const app = express();
const PORT = process.env.PORT || 3000;

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Keep alive for a moment to allow logs to flush if possible, or just log
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Root fallback
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// DIAGNOSTIC ROUTE - For troubleshooting DB connection
app.get('/api/debug-db', (req, res) => {
    const isProd = process.env.DATABASE_URL !== undefined;
    let dbInfo = {
        type: isProd ? 'PostgreSQL' : 'SQLite',
        databaseUrlSet: isProd,
        nodeEnv: process.env.NODE_ENV || 'not set'
    };

    if (isProd) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            dbInfo.censoredUrl = `${url.protocol}//${url.username}:****@${url.host}${url.pathname}`;
        } catch (e) {
            dbInfo.censoredUrl = "INVALID_URL_FORMAT";
        }
    }
    res.json(dbInfo);
});

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
    const { location, type, nomenclature, ip, user_name, specifications, name, stock_quantity, entry_date } = req.body;

    // For supplies, name and stock_quantity are critical.
    // For IT equipment, they might be null/defaults but we should allow updating them if provided.

    const sql = "UPDATE resources SET location = ?, type = ?, nomenclature = ?, ip = ?, user_name = ?, specifications = ?, name = ?, stock_quantity = ?, entry_date = ? WHERE id = ?";
    const specsJSON = typeof specifications === 'string' ? specifications : JSON.stringify(specifications || {});

    db.run(sql, [location, type, nomenclature, ip, user_name, specsJSON, name, stock_quantity, entry_date, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Resource not found" });
        res.json({ success: true });
    });
});

// CREATE Resource (Inventory IT)
app.post('/api/resources', (req, res) => {
    const { location, type, nomenclature, ip, user_name, specifications, name, stock_quantity, entry_date } = req.body;
    const sql = "INSERT INTO resources (location, type, name, nomenclature, ip, user_name, specifications, stock_quantity, entry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const specsJSON = typeof specifications === 'string' ? specifications : JSON.stringify(specifications || {});
    const finalName = name || `Equipo ${type || 'Nuevo'}`;

    db.run(sql, [
        location || 'Pendiente',
        type || 'Nuevo',
        finalName,
        nomenclature || '',
        ip || '',
        user_name || '',
        specsJSON,
        stock_quantity || 1,
        entry_date || null
    ], function (err) {
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

// === SUPPLY DELIVERIES API ===

// GET Deliveries
app.get('/api/supply-deliveries', (req, res) => {
    db.all("SELECT * FROM supply_deliveries ORDER BY delivery_date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// CREATE Delivery (Subtracts from resources stock)
app.post('/api/supply-deliveries', (req, res) => {
    const { location, supply_name, delivery_date, receiver_name, notes, attachment } = req.body;

    async function process() {
        let attachmentUrl = null;
        if (attachment && attachment.data) {
            const matches = attachment.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const ext = matches[1].split('/')[1] || 'bin';
                const buffer = Buffer.from(matches[2], 'base64');
                const filename = `supply_${Date.now()}.${ext}`;
                const filepath = path.join(uploadDir, filename);
                try {
                    fs.writeFileSync(filepath, buffer);
                    attachmentUrl = `/uploads/${filename}`;
                } catch (e) {
                    console.error("Error saving attachment:", e);
                }
            }
        }

        db.serialize(() => {
            const sql = `INSERT INTO supply_deliveries (location, supply_name, delivery_date, receiver_name, notes, attachment_url) 
                         VALUES (?, ?, ?, ?, ?, ?)`;

            db.run(sql, [location, supply_name, delivery_date, receiver_name, notes, attachmentUrl], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const deliveryId = this.lastID;

                // Decrement Stock in resources
                const updateStockSql = "UPDATE resources SET stock_quantity = stock_quantity - 1 WHERE name = ? AND type = 'Insumo'";
                db.run(updateStockSql, [supply_name], function (err) {
                    if (err) console.error("Error updating supply stock:", err.message);
                    res.json({ id: deliveryId, success: true, stock_updated: this.changes > 0, url: attachmentUrl });
                });
            });
        });
    }
    process();
});

// UPDATE Delivery
app.put('/api/supply-deliveries/:id', (req, res) => {
    const { id } = req.params;
    const { location, supply_name, delivery_date, receiver_name, notes, attachment } = req.body;

    db.get("SELECT supply_name, attachment_url FROM supply_deliveries WHERE id = ?", [id], (err, oldRecord) => {
        if (err || !oldRecord) return res.status(404).json({ error: "Record not found" });

        async function process() {
            let attachmentUrl = oldRecord.attachment_url;
            if (attachment && attachment.data) {
                const matches = attachment.data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    const ext = matches[1].split('/')[1] || 'bin';
                    const buffer = Buffer.from(matches[2], 'base64');
                    const filename = `supply_${Date.now()}.${ext}`;
                    const filepath = path.join(uploadDir, filename);
                    try {
                        fs.writeFileSync(filepath, buffer);
                        attachmentUrl = `/uploads/${filename}`;
                    } catch (e) {
                        console.error("Error saving attachment:", e);
                    }
                }
            }

            const sql = `UPDATE supply_deliveries SET location = ?, supply_name = ?, delivery_date = ?, receiver_name = ?, notes = ?, attachment_url = ? 
                         WHERE id = ?`;

            db.run(sql, [location, supply_name, delivery_date, receiver_name, notes, attachmentUrl, id], function (err) {
                if (err) return res.status(500).json({ error: err.message });

                if (oldRecord.supply_name !== supply_name) {
                    // Restore old stock
                    db.run("UPDATE resources SET stock_quantity = stock_quantity + 1 WHERE name = ? AND type = 'Insumo'", [oldRecord.supply_name], () => {
                        // Subtract new stock
                        db.run("UPDATE resources SET stock_quantity = stock_quantity - 1 WHERE name = ? AND type = 'Insumo'", [supply_name], () => {
                            res.json({ success: true, url: attachmentUrl });
                        });
                    });
                } else {
                    res.json({ success: true, url: attachmentUrl });
                }
            });
        }
        process();
    });
});

// DELETE Delivery
app.delete('/api/supply-deliveries/:id', (req, res) => {
    const { id } = req.params;

    db.get("SELECT supply_name FROM supply_deliveries WHERE id = ?", [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Record not found" });

        const supplyName = row.supply_name;

        db.run("DELETE FROM supply_deliveries WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Restore stock
            db.run("UPDATE resources SET stock_quantity = stock_quantity + 1 WHERE name = ? AND type = 'Insumo'", [supplyName], (err) => {
                if (err) console.error("Error restoring supply stock:", err.message);
                res.json({ success: true, deleted: this.changes });
            });
        });
    });
});

// Start Server
// Start Server
// Start Server
const HOST = '0.0.0.0'; // Bind to all interfaces for Cloud/Docker
app.listen(PORT, HOST, () => {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
    console.log(`Usuario: Sistemas | Pass: J.Grillo`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL Present: ${!!process.env.DATABASE_URL}`);
});
