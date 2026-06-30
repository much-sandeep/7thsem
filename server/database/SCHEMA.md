# SmartBasket Analytics — Database Schema Design

Two MySQL schemas power SmartBasket Analytics: one for **live operations** and one for **archived history**.

```
pos_operational  ──(weekly archive)──▶  pos_warehouse
     │                                         │
     └── current week data                     └── historical snapshots
```

---

## Schemas

| Schema | Purpose | ID strategy |
|--------|---------|-------------|
| `pos_operational` | Live data for the current business week — sales, stock, users | `AUTO_INCREMENT` |
| `pos_warehouse` | Archived snapshots moved at end of each week | IDs **preserved** from operational (no auto-increment) |

Both schemas share **identical table structures** so archival is a straight `INSERT … SELECT` with no transformation.

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   users     │         │    bills     │         │   items     │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)      │◀──┐     │ id (PK)     │
│ username    │         │ date         │   │     │ name        │
│ password_   │         │ total_amount │   │     │ price       │
│   hash      │         │ cash_received│   │     │ stock       │
│ role        │         │ change_amount│   │     └──────┬──────┘
└─────────────┘         └──────┬───────┘   │            │
                               │           │            │
                               │    ┌──────┴────────────┴──┐
                               │    │      bill_items        │
                               └───▶│ id (PK)                │
                                    │ bill_id (FK → bills)   │
                                    │ item_id (FK → items)   │
                                    │ quantity               │
                                    │ price                  │
                                    └────────────────────────┘

┌─────────────┐
│  settings   │   (standalone config — no FKs)
├─────────────┤
│ id (PK)     │
│ min_support │
│ min_confidence │
└─────────────┘
```

---

## Tables

### `users`
Stores system operators (admins and cashiers).

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED PK | Auto-increment (operational only) |
| `username` | VARCHAR(50) UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | bcrypt hash — never store plaintext |
| `role` | ENUM | `admin` or `cashier` |

**Indexes:** `PRIMARY KEY (id)`, `UNIQUE (username)`, `INDEX (role)`

---

### `items`
Product catalog with live stock count.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED PK | |
| `name` | VARCHAR(150) | Searchable product name |
| `price` | DECIMAL(10,2) | Current shelf price |
| `stock` | INT UNSIGNED | Units on hand |

**Indexes:** `PRIMARY KEY (id)`, `INDEX (name)`

**Constraints:** `price >= 0`, `stock >= 0`

---

### `bills`
One row per checkout transaction.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED PK | |
| `date` | DATETIME | Transaction timestamp |
| `total_amount` | DECIMAL(10,2) | Sum of all line items |
| `cash_received` | DECIMAL(10,2) | Cash tendered by customer |
| `change_amount` | DECIMAL(10,2) | `cash_received − total_amount` |

**Indexes:** `PRIMARY KEY (id)`, `INDEX (date)` — date index supports weekly queries and archival cutoff

---

### `bill_items`
Line items within a bill. Implements the **many-to-many** relationship between bills and items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED PK | |
| `bill_id` | INT UNSIGNED FK | → `bills.id` |
| `item_id` | INT UNSIGNED FK | → `items.id` |
| `quantity` | INT UNSIGNED | Units sold (≥ 1) |
| `price` | DECIMAL(10,2) | **Snapshot** of unit price at sale time |

**Why snapshot `price`?** Item prices change over time. Storing the price on each line item preserves accurate historical revenue even after a price update.

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX (bill_id)` — fast lookup of all items in a bill
- `INDEX (item_id)` — fast lookup of sales history per product
- `INDEX (bill_id, item_id)` — composite for association-rule mining queries

**Foreign keys:**
- `bill_id → bills.id` — `ON DELETE CASCADE` (deleting a bill removes its line items)
- `item_id → items.id` — `ON DELETE RESTRICT` (cannot delete a product that has sales history)

---

### `settings`
Global application configuration. The `min_support` and `min_confidence` columns configure **association rule mining** thresholds (e.g., "customers who buy X also buy Y").

| Column | Type | Notes |
|--------|------|-------|
| `id` | INT UNSIGNED PK | |
| `min_support` | DECIMAL(5,4) | Minimum frequency (0.0 – 1.0) |
| `min_confidence` | DECIMAL(5,4) | Minimum rule confidence (0.0 – 1.0) |

**Indexes:** `PRIMARY KEY (id)` only — small table, single row expected

---

## Relationships Summary

| From | To | Cardinality | FK column | On delete |
|------|----|-------------|-----------|-----------|
| `bill_items` | `bills` | N : 1 | `bill_id` | CASCADE |
| `bill_items` | `items` | N : 1 | `item_id` | RESTRICT |
| `bills` | `users` | — | *(not linked yet — add `user_id` in a future migration if needed)* | — |

> `users` and `settings` are standalone tables with no foreign key dependencies in this design.

---

## Operational vs Warehouse Strategy

```
Week N (live)                    End of week
─────────────────                ─────────────────────────────
pos_operational                  pos_warehouse
  bills (Mon–Sun)    ──MOVE──▶    bills (archived)
  bill_items         ──MOVE──▶    bill_items
  items (snapshot)   ──COPY──▶    items (snapshot)
  settings           ──COPY──▶    settings
                                   users (snapshot)

pos_operational                  pos_operational
  TRUNCATE bills/bill_items  ◀──  (cleared for new week)
  items stock reset/updated
```

**Why two schemas instead of one table with a `status` flag?**
- Operational queries stay fast (smaller working set)
- Warehouse can live on cheaper/slower storage
- No risk of accidental writes to archived data
- Identical structure = zero-transform archival

---

## Indexing Strategy

| Table | Index | Reason |
|-------|-------|--------|
| `users` | `UNIQUE (username)` | Login lookup |
| `users` | `(role)` | Filter admins vs cashiers |
| `items` | `(name)` | Product search at checkout |
| `bills` | `(date)` | Weekly range queries + archival cutoff |
| `bill_items` | `(bill_id)` | Load all lines for a receipt |
| `bill_items` | `(item_id)` | Product sales history / mining |
| `bill_items` | `(bill_id, item_id)` | Co-occurrence queries for recommendations |

All foreign key columns are indexed automatically by InnoDB for referential integrity performance.

---

## Running the Scripts

Run in order from the `server/database/` directory:

```bash
mysql -u root -p < server/database/01_create_schemas.sql
mysql -u root -p < server/database/02_operational_tables.sql
mysql -u root -p < server/database/03_warehouse_tables.sql
mysql -u root -p < server/database/04_sample_data_operational.sql
mysql -u root -p < server/database/05_sample_data_warehouse.sql
```

Or from a MySQL shell (must `cd` into `server/database/` first):

```sql
SOURCE 00_run_all.sql;
```

### File reference

| File | Purpose |
|------|---------|
| `01_create_schemas.sql` | Creates `pos_operational` and `pos_warehouse` databases |
| `02_operational_tables.sql` | Tables for live/current-week data |
| `03_warehouse_tables.sql` | Tables for archived data |
| `04_sample_data_operational.sql` | Seed data for `pos_operational` only |
| `05_sample_data_warehouse.sql` | Seed data for `pos_warehouse` only |
| `00_run_all.sql` | Runs all scripts in order |

---

## Sample Data Overview

**pos_operational** (current week):
- 2 users (`admin`, `cashier`)
- 8 menu items
- 1 settings row (`min_support=0.05`, `min_confidence=0.60`)
- 4 bills with 9 line items total

**pos_warehouse** (prior week archive):
- Same users (IDs preserved)
- 7 items (snapshot)
- 2 archived bills with 3 line items

---

## Future Extensions (not in scope)

- Add `user_id FK` on `bills` to track which cashier processed each sale
- Add `archived_at` timestamp column on warehouse tables
- Add `categories` table for item grouping
- Partition `pos_warehouse.bills` by month for very large archives
