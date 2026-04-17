const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

// ==================== MYSQL DATABASE SETUP ====================
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Leave empty '' if using XAMPP with no password
    database: 'planb_db',
    port: 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(conn => { console.log('✅ Connected to MySQL!'); conn.release(); })
    .catch(err => console.error('❌ Connection failed. Did you start XAMPP/MySQL?', err));

// ==================== HELPER FUNCTIONS ====================

async function getAdminPassword() {
    const [rows] = await db.query("SELECT value FROM settings WHERE `key` = 'adminPassword'");
    return rows[0]?.value || 'admin123';
}

async function getBankDetails() {
    const [rows] = await db.query("SELECT value FROM settings WHERE `key` = 'bankDetails'");
    return rows[0] ? JSON.parse(rows[0].value) : {};
}

async function getAllOrders() {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY createdAt DESC');
    return rows.map(row => ({
        orderId: row.orderId,
        customer: {
            name: row.customerName,
            phone: row.customerPhone,
            address: row.customerAddress,
            instructions: row.customerInstructions
        },
        items: JSON.parse(row.items || '[]'),
        subtotal: row.subtotal,
        paymentMethod: row.paymentMethod,
        status: row.status,
        orderDate: row.orderDate,
        createdAt: row.createdAt
    }));
}

async function getAllReviews() {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY createdAt DESC');
    return rows;
}

async function getAllMenuItems() {
    const [rows] = await db.query('SELECT * FROM menu_items');
    return rows.map(item => ({
        ...item,
        proteins: JSON.parse(item.proteins || '[]')
    }));
}

// ==================== EXPRESS + WEBSOCKET ====================

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const clients = new Set();

function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(message);
    });
}

wss.on('connection', async (ws) => {
    console.log('New client connected');
    clients.add(ws);

    try {
        ws.send(JSON.stringify({
            type: 'initial_data',
            orders: await getAllOrders(),
            reviews: await getAllReviews(),
            menuItems: await getAllMenuItems(),
            bankDetails: await getBankDetails()
        }));
    } catch (err) {
        console.error('Error sending initial data:', err);
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    });

    ws.on('close', () => { clients.delete(ws); console.log('Client disconnected'); });
    ws.on('error', (err) => console.error('WS error:', err));
});

// ==================== API ROUTES ====================

// ✅ FIXED: Place Order — broadcasts 'new_order' so admin panel shows alert instantly
app.post('/api/orders', async (req, res) => {
    try {
        const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
        const { customer, items, subtotal, paymentMethod } = req.body;
        const now = new Date();
        const orderDate = now.toISOString().split('T')[0];
        const createdAt = now.toISOString();

        // Insert into database (includes createdAt)
        await db.query(
            'INSERT INTO orders (orderId, customerName, customerPhone, customerAddress, customerInstructions, items, subtotal, paymentMethod, status, orderDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, customer.name, customer.phone, customer.address, customer.instructions, JSON.stringify(items), subtotal, paymentMethod, 'Pending', orderDate, createdAt]
        );

        // ✅ Build the new order object
        const newOrder = {
            orderId,
            customer: {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                instructions: customer.instructions
            },
            items,
            subtotal,
            paymentMethod,
            status: 'Pending',
            orderDate,
            createdAt
        };

        // ✅ Broadcast as 'new_order' — triggers popup alert in admin panel immediately
        broadcast({ type: 'new_order', order: newOrder });

        console.log(`📦 New Order: ${orderId} | Customer: ${customer.name} | Rs. ${subtotal}`);

        res.json({ success: true, orderId });

    } catch (err) {
        console.error('Order Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get Orders
app.get('/api/orders', async (req, res) => {
    try {
        res.json(await getAllOrders());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status
app.put('/api/orders/:orderId', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE orderId = ?',
            [req.body.status, req.params.orderId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });

        broadcast({ type: 'order_updated', orderId: req.params.orderId, status: req.body.status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit Review
app.post('/api/reviews', async (req, res) => {
    try {
        const now = new Date();
        const review = {
            name: req.body.name,
            rating: req.body.rating,
            text: req.body.text,
            date: now.toLocaleDateString(),
            createdAt: now.toISOString()
        };

        await db.query(
            'INSERT INTO reviews (name, rating, text, date, createdAt) VALUES (?, ?, ?, ?, ?)',
            [review.name, review.rating, review.text, review.date, review.createdAt]
        );

        broadcast({ type: 'new_review', review });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Reviews
app.get('/api/reviews', async (req, res) => {
    try {
        res.json(await getAllReviews());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Review
app.delete('/api/reviews/:index', async (req, res) => {
    try {
        const reviews = await getAllReviews();
        const index = parseInt(req.params.index);
        if (index < 0 || index >= reviews.length) return res.status(404).json({ error: 'Review not found' });

        await db.query('DELETE FROM reviews WHERE id = ?', [reviews[index].id]);
        broadcast({ type: 'review_deleted', index });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Menu Item Base Price
app.put('/api/menu/:itemId/price', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE menu_items SET basePrice = ? WHERE id = ?',
            [req.body.basePrice, parseInt(req.params.itemId)]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Menu item not found' });

        broadcast({ type: 'price_updated', itemId: parseInt(req.params.itemId), basePrice: req.body.basePrice });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Per-Type (Protein) Prices
app.put('/api/menu/:itemId/protein-prices', async (req, res) => {
    try {
        const { proteins } = req.body;
        if (!Array.isArray(proteins)) return res.status(400).json({ error: 'proteins must be an array' });

        const [result] = await db.query(
            'UPDATE menu_items SET proteins = ? WHERE id = ?',
            [JSON.stringify(proteins), parseInt(req.params.itemId)]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Menu item not found' });

        broadcast({ type: 'protein_prices_updated', itemId: parseInt(req.params.itemId), proteins });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Stock
app.put('/api/menu/:itemId/stock', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE menu_items SET stock = ? WHERE id = ?',
            [req.body.stock, parseInt(req.params.itemId)]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Menu item not found' });

        broadcast({ type: 'stock_updated', itemId: parseInt(req.params.itemId), stock: req.body.stock });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Menu Items
app.get('/api/menu', async (req, res) => {
    try {
        res.json(await getAllMenuItems());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save Bank Details
app.post('/api/bank-details', async (req, res) => {
    try {
        const value = JSON.stringify(req.body);
        await db.query(
            "INSERT INTO settings (`key`, value) VALUES ('bankDetails', ?) ON DUPLICATE KEY UPDATE value = ?",
            [value, value]
        );
        broadcast({ type: 'bank_details_updated', bankDetails: req.body });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Bank Details
app.get('/api/bank-details', async (req, res) => {
    try {
        res.json(await getBankDetails());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change Admin Password
app.post('/api/change-password', async (req, res) => {
    try {
        const currentPassword = await getAdminPassword();
        if (req.body.currentPassword !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        await db.query(
            "INSERT INTO settings (`key`, value) VALUES ('adminPassword', ?) ON DUPLICATE KEY UPDATE value = ?",
            [req.body.newPassword, req.body.newPassword]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear All Orders & Reviews (admin password required)
app.post('/api/clear-data', async (req, res) => {
    try {
        const { adminPassword } = req.body;
        const currentPassword = await getAdminPassword();
        if (!adminPassword || adminPassword !== currentPassword) {
            return res.status(401).json({ success: false, error: 'Incorrect admin password' });
        }
        await db.query('DELETE FROM orders');
        await db.query('DELETE FROM reviews');
        broadcast({ type: 'data_cleared' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            connectedClients: clients.size,
            storage: 'MySQL'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   Plan B Restaurant Server Running     ║
╠════════════════════════════════════════╣
║  http://localhost:${PORT}                   ║
║  WebSocket: ws://localhost:${PORT}          ║
║  Storage: MySQL → planb_db             ║
╚════════════════════════════════════════╝
    `);
});

process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await db.end();
    server.close(() => { console.log('Server closed'); process.exit(0); });
});
