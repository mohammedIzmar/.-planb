-- ========================================================================
-- Plan B Restaurant - Complete Database Schema & Sample Data
-- SQLite Database Dump
-- ========================================================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS settings;

-- ========================================================================
-- TABLE: menu_items
-- Description: Restaurant menu items with pricing and stock management
-- ========================================================================
CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    basePrice REAL DEFAULT 0,
    proteins TEXT,
    stock INTEGER DEFAULT 0
);

-- Insert menu items
INSERT INTO menu_items (id, name, category, basePrice, proteins, stock) VALUES
(1, 'Parata', 'Breads', 50.00, '[]', 50),
(2, 'Kottu', 'Main Courses', 0, '[{"name":"Egg Kottu","price":750},{"name":"Cheese Kottu","price":850},{"name":"Chicken Kottu","price":950},{"name":"Beef Kottu","price":1050}]', 30),
(3, 'Dolphin Kottu', 'Seafood', 1000.00, '[]', 25),
(4, 'Fried Rice', 'Rice Dishes', 0, '[{"name":"Chicken","price":800},{"name":"Egg","price":700},{"name":"Beef","price":900}]', 40),
(5, 'Lamprais', 'Main Courses', 450.00, '[]', 35),
(6, 'Deviled Dishes', 'Main Courses', 0, '[{"name":"Deviled Chicken","price":550},{"name":"Deviled Beef","price":650},{"name":"Deviled Prawns","price":750}]', 28),
(7, 'String Hoppers', 'Rice Dishes', 400.00, '[]', 45),
(8, 'Wadai', 'Snacks', 80.00, '[]', 60),
(9, 'Cutlets', 'Snacks', 0, '[{"name":"Chicken Cutlet","price":150},{"name":"Fish Cutlet","price":180}]', 50),
(10, 'Curry & Rice', 'Rice Dishes', 0, '[{"name":"Chicken Curry","price":600},{"name":"Fish Curry","price":700},{"name":"Vegetable Curry","price":450}]', 38);

-- ========================================================================
-- TABLE: orders
-- Description: Customer orders with delivery and payment information
-- ========================================================================
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT UNIQUE NOT NULL,
    customerName TEXT,
    customerPhone TEXT,
    customerAddress TEXT,
    customerInstructions TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    paymentMethod TEXT,
    status TEXT DEFAULT 'Pending',
    orderDate TEXT,
    createdAt TEXT NOT NULL
);

-- Insert sample orders
INSERT INTO orders (orderId, customerName, customerPhone, customerAddress, customerInstructions, items, subtotal, paymentMethod, status, orderDate, createdAt) VALUES
('ORDER001', 'Rajesh Kumar', '+94771234567', '42 Galle Road, Colombo 3', 'Extra spicy, no onions', '[{"id":2,"name":"Kottu","variant":"Chicken Kottu","price":950,"quantity":2},{"id":1,"name":"Parata","price":50,"quantity":1}]', 1950.00, 'Bank Transfer', 'Delivered', '4/14/2026, 10:30:00 AM', '2026-04-14T10:30:00.000Z'),
('ORDER002', 'Priya Sharma', '+94772234567', '128 Colombo Street, Nugegoda', 'Mild spice level', '[{"id":4,"name":"Fried Rice","variant":"Beef","price":900,"quantity":1},{"id":5,"name":"Lamprais","price":450,"quantity":1}]', 1350.00, 'Credit Card', 'Delivered', '4/14/2026, 11:15:00 AM', '2026-04-14T11:15:00.000Z'),
('ORDER003', 'Ahmed Hassan', '+94773234567', '75 Beira Lake Road, Colombo 2', 'Vegetarian options', '[{"id":6,"name":"Deviled Dishes","variant":"Vegetable Curry","price":450,"quantity":2},{"id":7,"name":"String Hoppers","price":400,"quantity":1}]', 1300.00, 'Cash on Delivery', 'In Preparation', '4/15/2026, 2:45:00 PM', '2026-04-15T14:45:00.000Z'),
('ORDER004', 'Maria Gonzalez', '+94774234567', '35 Mount Lavinia Road, Colombo 6', 'Please ring twice', '[{"id":3,"name":"Dolphin Kottu","price":1000,"quantity":1},{"id":8,"name":"Wadai","price":80,"quantity":5}]', 1400.00, 'Bank Transfer', 'Ready for Pickup', '4/15/2026, 4:20:00 PM', '2026-04-15T16:20:00.000Z'),
('ORDER005', 'David Chen', '+94775234567', '200 Galle Face Court, Colombo 1', 'Delivery after 6 PM', '[{"id":2,"name":"Kottu","variant":"Beef Kottu","price":1050,"quantity":1},{"id":9,"name":"Cutlets","variant":"Fish Cutlet","price":180,"quantity":3},{"id":1,"name":"Parata","price":50,"quantity":2}]', 1710.00, 'Credit Card', 'Pending', '4/16/2026, 1:10:00 PM', '2026-04-16T13:10:00.000Z'),
('ORDER006', 'Amara Silva', '+94776234567', '90 Independence Avenue, Colombo 7', 'No chilli powder', '[{"id":10,"name":"Curry & Rice","variant":"Fish Curry","price":700,"quantity":2},{"id":4,"name":"Fried Rice","variant":"Egg","price":700,"quantity":1}]', 2100.00, 'Cash on Delivery', 'Out for Delivery', '4/16/2026, 3:30:00 PM', '2026-04-16T15:30:00.000Z'),
('ORDER007', 'Sophie Anderson', '+94777234567', '15 Horton Place, Colombo 7', 'Extra gravy, please', '[{"id":6,"name":"Deviled Dishes","variant":"Deviled Prawns","price":750,"quantity":1},{"id":7,"name":"String Hoppers","price":400,"quantity":2}]', 1550.00, 'Bank Transfer', 'Delivered', '4/13/2026, 7:00:00 PM', '2026-04-13T19:00:00.000Z'),
('ORDER008', 'Vikram Patel', '+94778234567', '220 High Level Road, Colombo 6', 'Ring doorbell', '[{"id":2,"name":"Kottu","variant":"Egg Kottu","price":750,"quantity":2},{"id":8,"name":"Wadai","price":80,"quantity":3},{"id":1,"name":"Parata","price":50,"quantity":1}]', 1710.00, 'Credit Card', 'Delivered', '4/12/2026, 6:45:00 PM', '2026-04-12T18:45:00.000Z');

-- ========================================================================
-- TABLE: reviews
-- Description: Customer reviews and ratings
-- ========================================================================
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT,
    date TEXT,
    createdAt TEXT NOT NULL
);

-- Insert sample reviews
INSERT INTO reviews (name, rating, text, date, createdAt) VALUES
('Rajesh Kumar', 5, 'Absolutely delicious! The Kottu was perfectly cooked and arrived hot. Will definitely order again!', '4/14/2026', '2026-04-14T10:45:00.000Z'),
('Priya Sharma', 4, 'Great taste and quick delivery. The Lamprais was amazing but the rice could have been fresher.', '4/14/2026', '2026-04-14T12:00:00.000Z'),
('Ahmed Hassan', 5, 'Best deviled dishes I''ve had in a long time. Highly recommend Plan B!', '4/15/2026', '2026-04-15T15:30:00.000Z'),
('Maria Gonzalez', 4, 'Dolphin Kottu was fantastic! Portion size could be slightly bigger though.', '4/15/2026', '2026-04-15T17:00:00.000Z'),
('David Chen', 5, 'Excellent quality and flavors. Customer service was very responsive. 5 stars!', '4/13/2026', '2026-04-13T20:15:00.000Z'),
('Amara Silva', 4, 'Very tasty curry! Delivery was a bit slow but food was worth the wait.', '4/11/2026', '2026-04-11T18:30:00.000Z'),
('Sophie Anderson', 5, 'The Deviled Prawns were absolutely incredible! Best meal I''ve had in weeks.', '4/13/2026', '2026-04-13T20:00:00.000Z'),
('Vikram Patel', 5, 'Perfect! Everything was fresh and hot. The Wadai was crispy. Keep up the great work!', '4/12/2026', '2026-04-12T19:30:00.000Z'),
('Lisa Thompson', 3, 'Food was okay but took longer than expected. Better quality control needed.', '4/10/2026', '2026-04-10T16:45:00.000Z'),
('Kamal Senanayake', 5, 'Consistently excellent. Plan B is my go-to for authentic Sri Lankan food!', '4/09/2026', '2026-04-09T19:00:00.000Z');

-- ========================================================================
-- TABLE: settings
-- Description: System configuration (passwords, bank details, etc.)
-- ========================================================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
('adminPassword', 'admin123'),
('bankDetails', '{"bankName":"Commercial Bank of Ceylon","accountHolder":"Plan B Restaurant","accountNumber":"1234567890","branchCode":"001","swiftCode":"CBCECLK"}');

-- ========================================================================
-- INDEX CREATION for better query performance
-- ========================================================================
CREATE INDEX idx_orders_orderId ON orders(orderId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_createdAt ON orders(createdAt DESC);
CREATE INDEX idx_reviews_createdAt ON reviews(createdAt DESC);
CREATE INDEX idx_menu_category ON menu_items(category);

-- ========================================================================
-- DATABASE METADATA
-- ========================================================================
-- Total Tables: 4
-- Total Records:
--   - menu_items: 10
--   - orders: 8
--   - reviews: 10
--   - settings: 2
--
-- Features:
--   ✓ Order management with status tracking
--   ✓ Menu items with protein variants and stock control
--   ✓ Customer reviews with ratings
--   ✓ System settings (admin password, bank details)
--   ✓ Timestamps for all records
--   ✓ Indexed for performance
-- ========================================================================
