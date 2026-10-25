# PennyPilot — Expense Tracker

A responsive, editorial-style personal finance dashboard built with React + Vite. The visual identity uses forest green, warm cream, and coral accents.

## Features

- Income, expense, and available-balance summaries calculated from transaction data.
- Cash-flow area chart and category spending donut chart.
- Create, edit, and delete transactions with client-side validation.
- Search, filter by income/expense, and sort transaction history.
- Export transactions to CSV.
- Responsive sidebar and mobile layout.
- API adapter ready for an Express backend.
- Demo data is built in, so the app works immediately without a backend.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Connect an Express backend

1. Copy `.env.example` to `.env`.
2. Set your backend URL and enable API mode:

```env
VITE_API_URL=http://localhost:5000
VITE_USE_API=true
```

3. Restart Vite after editing `.env`.
4. Implement or adjust the API routes in `src/api.js`.

### Expected API contract

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/transactions` | Return an array, or `{ "transactions": [] }` |
| POST | `/api/transactions` | Create transaction; JSON body below |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction; may return HTTP 204 |

Example transaction JSON:

```json
{
  "title": "Weekly groceries",
  "amount": 1840,
  "type": "expense",
  "category": "Groceries",
  "date": "2026-10-04",
  "note": "Fresh market + pantry"
}
```

The API should validate the amount (`amount > 0`), required title, type (`income` or `expense`), category, and valid date on the server. Enable CORS for your Vite origin during local development.

## Important implementation notes

- Demo mode uses in-memory sample transactions; changes reset when the page reloads.
- API mode sends create, update, and delete operations to your backend. The backend is responsible for persistent storage.
- The cash-flow chart currently uses illustrative monthly history in `src/App.jsx`; replace `monthlyData` with data aggregated from your API for a fully data-driven monthly chart.
- Dashboard income/expense/balance and category totals are calculated from the current transaction list.
- Currency formatting uses Indian Rupees (`en-IN`, `INR`); change the `money` helper if needed.
- This is a frontend project; authentication and server-side security should be implemented in the backend if required.

## Suggested next steps

1. Add server-side validation and persistent database storage.
2. Add date-range/month selection for dashboard summaries.
3. Add authentication if the app will be deployed with user-specific records.
4. Add tests for validation and CRUD flows.
