USE pos_warehouse;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  id    INT UNSIGNED  NOT NULL,
  name  VARCHAR(150)  NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_items_name (name),
  CONSTRAINT chk_items_price CHECK (price >= 0),
  CONSTRAINT chk_items_stock CHECK (stock >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bills (
  id            INT UNSIGNED  NOT NULL,
  date          DATETIME      NOT NULL,
  total_amount  DECIMAL(10,2) NOT NULL,
  cash_received DECIMAL(10,2) NOT NULL,
  change_amount DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_bills_date (date),
  CONSTRAINT chk_bills_total  CHECK (total_amount  >= 0),
  CONSTRAINT chk_bills_cash   CHECK (cash_received >= 0),
  CONSTRAINT chk_bills_change CHECK (change_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bill_items (
  id       INT UNSIGNED  NOT NULL,
  bill_id  INT UNSIGNED  NOT NULL,
  item_id  INT UNSIGNED  NOT NULL,
  quantity INT UNSIGNED  NOT NULL,
  price    DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_bill_items_bill_id (bill_id),
  KEY idx_bill_items_item_id (item_id),
  KEY idx_bill_items_bill_item (bill_id, item_id),
  CONSTRAINT fk_bill_items_bill
    FOREIGN KEY (bill_id) REFERENCES bills (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_bill_items_item
    FOREIGN KEY (item_id) REFERENCES items (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT chk_bill_items_qty   CHECK (quantity >= 1),
  CONSTRAINT chk_bill_items_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id             INT UNSIGNED NOT NULL,
  min_support    DECIMAL(5,4) NOT NULL,
  min_confidence DECIMAL(5,4) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT chk_settings_support    CHECK (min_support    >= 0 AND min_support    <= 1),
  CONSTRAINT chk_settings_confidence CHECK (min_confidence >= 0 AND min_confidence <= 1)
) ENGINE=InnoDB;
