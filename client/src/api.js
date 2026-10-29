/*
  PennyPilot API adapter
  Connects the React frontend to the Express + MongoDB backend.
*/

const API_URL = (
  import.meta.env.VITE_API_URL || "https://pennypilot-expense-tracker.onrender.com"
).replace(/\/$/, "");

// API is ON by default. Set VITE_USE_API=false only if you want demo mode.
const USE_API = import.meta.env.VITE_USE_API !== "false";

console.log("USE_API:", USE_API, "API_URL:", API_URL);

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const result = await response.json();
      message = result.message || result.error || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}

function normalizeTransaction(transaction) {
  if (!transaction) return transaction;

  return {
    ...transaction,
    id: transaction._id || transaction.id,
    note: transaction.note ?? transaction.description ?? ""
  };
}

function unwrapTransactionList(result) {
  const transactions = Array.isArray(result)
    ? result
    : result?.data ?? result?.transactions ?? [];

  if (!Array.isArray(transactions)) {
    throw new Error("Invalid transactions response from backend");
  }

  return transactions.map(normalizeTransaction);
}

function unwrapSingleTransaction(result) {
  const transaction = result?.data ?? result?.transaction ?? result;
  return normalizeTransaction(transaction);
}

export const api = {
  useApi: USE_API,

  async listTransactions() {
    if (!USE_API) return null;

    const result = await request("/api/transactions");
    return unwrapTransactionList(result);
  },

  async createTransaction(transaction) {
    if (!USE_API) {
      return {
        ...transaction,
        id: crypto.randomUUID()
      };
    }

    const result = await request("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction)
    });

    return unwrapSingleTransaction(result);
  },

  async updateTransaction(id, transaction) {
    if (!USE_API) {
      return { ...transaction, id };
    }

    const result = await request(
      `/api/transactions/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(transaction)
      }
    );

    return unwrapSingleTransaction(result);
  },

  async deleteTransaction(id) {
    if (!USE_API) return true;

    await request(
      `/api/transactions/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    return true;
  }
};