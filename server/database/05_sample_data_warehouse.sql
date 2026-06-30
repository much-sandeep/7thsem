USE pos_warehouse;

INSERT INTO users (id, username, password_hash, role) VALUES
  (1, 'admin',   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
  (2, 'cashier', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'cashier');

INSERT INTO items (id, name, price, stock) VALUES
  (1, 'Espresso',         3.50, 180),
  (2, 'Cappuccino',       4.50, 140),
  (3, 'Latte',            4.75, 110),
  (4, 'Croissant',        2.75,  70),
  (5, 'Blueberry Muffin', 3.25,  55),
  (6, 'Sandwich',         6.50,  40),
  (7, 'Bottled Water',    1.50, 280);

INSERT INTO settings (id, min_support, min_confidence) VALUES
  (1, 0.0500, 0.6000);

INSERT INTO bills (id, date, total_amount, cash_received, change_amount) VALUES
  (101, '2026-06-23 10:00:00', 7.00, 10.00, 3.00),
  (102, '2026-06-24 12:30:00', 8.00, 10.00, 2.00);

INSERT INTO bill_items (id, bill_id, item_id, quantity, price) VALUES
  (1001, 101, 1, 2, 3.50),
  (1002, 102, 3, 1, 4.75),
  (1003, 102, 5, 1, 3.25);
