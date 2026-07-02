# 🛒 SmartBasket Analytics

A full-stack **retail POS + analytics** application that combines everyday point-of-sale billing with **market-basket analysis** powered by the **FP-Growth** algorithm. Shopkeepers can manage products, generate invoices, and instantly discover which items customers tend to buy together.

---

## 📖 Overview

SmartBasket Analytics is built for small retail stores that want more than a cash register. Every sale recorded through the billing screen becomes a *transaction*, and the system mines those transactions to reveal hidden buying patterns:

- **Point of Sale (POS):** manage inventory and create bills in seconds.
- **Analytics engine:** run FP-Growth on real sales data to find frequent itemsets and association rules.
- **Dashboard:** visualize revenue, top products, weekly trends, and item frequency at a glance.

All monetary values are displayed in **Nepalese Rupees (NPR)**.

---

## ✨ Features

### 🧾 POS & Billing
- Product catalog with create / edit / delete (admin)
- Add items to a cart, adjust quantities, and check out
- Automatic total, cash-received, and change calculation
- Printable-style invoice on every sale
- Live stock updates after each transaction

### 📊 Dashboard & Analytics
- Summary cards: **Total Revenue**, **Total Bills**, **Items Sold**
- **Weekly Sales Trend** (line chart, last 7 days)
- **Top 5 Items** (bar chart)
- **Item Frequency** (bar chart from FP-Growth)

### 🔍 Market-Basket Analysis
- **Frequent Itemsets** page — item combinations with support count & support %
- **Association Rules** page — `antecedent → consequent` with support, confidence, and lift

### 🔐 Authentication
- Session-based login / logout
- Protected routes with role awareness (admin vs. user)

---

## 🧠 What is FP-Growth?

**FP-Growth (Frequent Pattern Growth)** is a data-mining algorithm used for **market-basket analysis**. It works in a few simple steps:

1. Each bill is treated as a *transaction* (a set of purchased items).
2. The algorithm builds a compact **FP-Tree** that summarizes how often items appear together.
3. It mines the tree to extract **frequent itemsets** (items commonly bought together).
4. From those itemsets, it generates **association rules** measured by **support**, **confidence**, and **lift**.

The result: insights like *"customers who buy bread and milk often also buy eggs"* — useful for product placement, bundles, and promotions.

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 19, Vite, React Router, Chart.js |
| Backend    | Node.js, Express                    |
| Database   | MySQL 8                             |
| Auth       | express-session (cookie sessions)   |
| Analytics  | Custom FP-Growth implementation (Node.js) |

---

## 🏗️ Architecture

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐      SQL       ┌─────────────┐
│   Frontend  │  ───────────────▶   │   Backend    │  ──────────▶   │   MySQL DB  │
│ React (Vite)│  ◀───────────────   │ Node/Express │  ◀──────────   │   (bills,   │
│  Dashboard  │                     │   REST API   │                │  items…)    │
└─────────────┘                     └──────┬───────┘                └─────────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  FP-Growth Engine │
                                  │ (itemsets + rules)│
                                  └──────────────────┘
```

**Flow:** The React frontend calls the Express REST API → the API reads/writes the MySQL database → the FP-Growth engine analyzes stored bills to produce frequent itemsets and association rules → results are returned to the dashboard for visualization.

---

## 📁 Project Structure

```
project7th/
├── client/   → React frontend (Vite)
└── server/   → Express backend + FP-Growth engine
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **MySQL** 8+

### 1️⃣ Backend

```bash
cd server
cp .env.example .env      # configure DB credentials
npm install
npm run dev
```

Server runs at **http://localhost:5001** (or the `PORT` set in `.env`).

### 2️⃣ Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## 🔑 Default Login

```
Username: admin
Password: admin123
```

---

## 💰 Currency Note

All prices, totals, and sales figures are formatted in **Nepalese Rupees (NPR)** using the browser's `Intl.NumberFormat('en-NP')`. Only the display formatting is localized — the underlying values and calculations are unchanged.

---

## 🌐 API Reference

| Method | Route                        | Description                     |
|--------|------------------------------|---------------------------------|
| GET    | `/api/health`                | Health check                    |
| POST   | `/api/auth/login`            | Login                           |
| POST   | `/api/auth/logout`           | Logout                          |
| GET    | `/api/auth/me`               | Current user                    |
| GET    | `/api/items`                 | List items                      |
| POST   | `/api/items`                 | Create item (admin)             |
| PUT    | `/api/items/:id`             | Update item (admin)             |
| DELETE | `/api/items/:id`             | Delete item (admin)             |
| GET    | `/api/bills`                 | List bills                      |
| POST   | `/api/bills`                 | Create a bill / sale            |
| GET    | `/api/dashboard/summary`     | Revenue, bills, items sold      |
| GET    | `/api/dashboard/daily-sales` | Daily sales totals              |
| GET    | `/api/dashboard/top-items`   | Best-selling items              |
| GET    | `/api/fp-growth/itemsets`    | Frequent itemsets               |
| GET    | `/api/fp-growth/rules`       | Association rules               |

---

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable       | Description       | Default                 |
|----------------|-------------------|-------------------------|
| PORT           | Server port       | 5001                    |
| DB_HOST        | MySQL host        | localhost               |
| DB_PORT        | MySQL port        | 3306                    |
| DB_USER        | MySQL user        | root                    |
| DB_PASSWORD    | MySQL password    | —                       |
| DB_NAME        | Database name     | pos_operational         |
| DB_WAREHOUSE_NAME | Archive (warehouse) database name | pos_warehouse |
| ARCHIVE_PERIOD_DAYS | Age (in days) after which bills are archived to the warehouse | 30 |
| SESSION_SECRET | Session secret    | —                       |
| CLIENT_URL     | Frontend origin   | http://localhost:5173   |

### Client (`client/.env`)

| Variable     | Description  | Default |
|--------------|--------------|---------|
| VITE_API_URL | API base URL | /api    |

