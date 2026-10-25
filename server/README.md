# PennyPilot Backend

Express + MongoDB REST API for the PennyPilot Expense Tracker.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and configure `MONGODB_URI`.

Local MongoDB example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pennypilot
CLIENT_URL=http://localhost:5173
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

## Start the API

Development (auto-restarts with nodemon):

```bash
npm run dev
```

Production:

```bash
npm start
```

API base URL: `http://localhost:5000`

- `GET /health` — API and database health
- `GET /api/transactions` — list transactions
- `POST /api/transactions` — create a transaction
- `PUT /api/transactions/:id` — update a transaction
- `DELETE /api/transactions/:id` — delete a transaction

Server-side validation checks title, positive finite amount, transaction type, category, and `YYYY-MM-DD` date.
