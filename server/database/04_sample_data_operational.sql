USE pos_operational;

INSERT INTO items (name, price, stock) VALUES
  ('Espresso',         3.50, 200),
  ('Cappuccino',       4.50, 150),
  ('Latte',            4.75, 120),
  ('Croissant',        2.75,  80),
  ('Blueberry Muffin', 3.25,  60),
  ('Sandwich',         6.50,  45),
  ('Bottled Water',    1.50, 300),
  ('Orange Juice',     3.00,  90);

INSERT INTO settings (min_support, min_confidence) VALUES
  (0.0500, 0.6000);

INSERT INTO bills (date, total_amount, cash_received, change_amount) VALUES
  ('2026-06-30 08:15:00',  6.25, 10.00, 3.75),
  ('2026-06-30 09:42:00', 12.50, 15.00, 2.50),
  ('2026-06-30 11:03:00',  8.00, 10.00, 2.00),
  ('2026-06-30 14:30:00', 10.75, 15.00, 4.25);

INSERT INTO bill_items (bill_id, item_id, quantity, price) VALUES
  (1, 1, 1, 3.50),
  (1, 4, 1, 2.75),
  (2, 2, 1, 4.50),
  (2, 3, 1, 4.75),
  (2, 5, 1, 3.25),
  (3, 6, 1, 6.50),
  (3, 7, 1, 1.50),
  (4, 2, 1, 4.50),
  (4, 3, 1, 4.75),
  (4, 7, 1, 1.50);
