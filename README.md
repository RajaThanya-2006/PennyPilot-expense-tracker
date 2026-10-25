# PennyPilot — Full-Stack Expense Tracker

PennyPilot is organized into separate frontend and backend projects for clear development and deployment.

## Folder structure

```text
pennypilot-fullstack/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── index.html
├── server/                 # Node.js + Express + MongoDB backend
│   ├── models/
│   │   └── Transaction.js
│   ├── routes/
│   │   └── transactions.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```

## 1. Start the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`, then set `MONGODB_URI` to your local MongoDB or MongoDB Atlas connection string.

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/health`.

## 2. Start the frontend

Open a **second terminal** in the project root:

```bash
cd client
npm install
```

Copy `client/.env.example` to `client/.env`. It should contain:

```env
VITE_API_URL=http://localhost:5000
VITE_USE_API=true
```

Then run:

```bash
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Add a transaction |
| PUT | `/api/transactions/:id` | Edit a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

The backend validates transaction data and stores it in MongoDB. Dashboard totals and category totals are calculated from the transaction records returned by the API.

## Notes

- Configure the frontend `VITE_API_URL` and backend `CLIENT_URL` to match your local or deployed URLs.
- Never commit `.env` files or real database credentials to GitHub.
- The monthly cash-flow chart currently uses illustrative monthly history; transaction totals and category breakdown are driven by the transaction list.
