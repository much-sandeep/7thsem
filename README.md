# SmartBasket Analytics

Full-stack retail analytics application with React (Vite) frontend and Express backend.

## Project Structure

```
/client   → React frontend (Vite)
/server   → Express backend
```

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

### Backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Server runs at `http://localhost:5001` (or port set in `.env`)

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Default Login

```
Username: admin
Password: admin123
```

## API

| Method | Route              | Description        |
|--------|--------------------|--------------------|
| GET    | `/api/health`      | Health check       |
| POST   | `/api/auth/login`  | Login              |
| POST   | `/api/auth/logout` | Logout             |
| GET    | `/api/auth/me`     | Current user       |

## Environment Variables

### Server (`server/.env`)

| Variable       | Description        | Default          |
|----------------|--------------------|------------------|
| PORT           | Server port        | 5000             |
| DB_HOST        | MySQL host         | localhost        |
| DB_PORT        | MySQL port         | 3306             |
| DB_USER        | MySQL user         | root             |
| DB_PASSWORD    | MySQL password     |                  |
| DB_NAME        | Database name      | pos_operational  |
| SESSION_SECRET | Session secret     |                  |
| CLIENT_URL     | Frontend origin    | http://localhost:5173 |

### Client (`client/.env`)

| Variable       | Description   | Default |
|----------------|---------------|---------|
| VITE_API_URL   | API base URL  | /api    |
