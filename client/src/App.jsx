
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  Bell,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Check,
  Clock,
  IndianRupee,
  CircleAlert,
  RefreshCw,
  Filter,
  ArrowUpDown,
  FileText,
  PiggyBank,
  CheckCheck,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { api } from "./api.js";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
];

const COLORS = [
  "#635bff",
  "#18a999",
  "#f59e0b",
  "#f16b6b",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
  "#64748b",
  "#84cc16",
];

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Income", icon: TrendingUp },
  { label: "Expenses", icon: TrendingDown },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Calendar", icon: CalendarDays },
  { label: "Insights", icon: BarChart3 },
];
const todayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeTransaction = (item) => {
  const dateValue = item.date || item.createdAt || todayString();

  return {
    ...item,
    id: String(item.id ?? item._id ?? ""),
    title: item.title || item.description || item.name || "Untitled",
    amount: Number(item.amount) || 0,
    type: String(item.type || "expense").toLowerCase(),
    category: item.category || "Other",
    date: String(dateValue).slice(0, 10),
    note: item.note || item.notes || "",
  };
};

const formatMonth = (date) =>
  date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

function StatCard({ title, value, subtitle, icon: Icon, tone, format = "money" }) {
  return (
    <div className="pp-stat-card">
      <div className={`pp-stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div className="pp-stat-content">
        <span className="pp-muted">{title}</span>
        <strong>{format === "percent" ? `${Number(value || 0).toFixed(1)}%` : format === "number" ? Number(value || 0).toLocaleString("en-IN") : money(value)}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function EmptyState({ title, message, action }) {
  return (
    <div className="pp-empty">
      <div className="pp-empty-icon">
        <FileText size={26} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("pennypilot-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("pennypilot-theme", theme);
    } catch (error) {
      console.warn("Unable to save theme preference:", error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activeNav, setActiveNav] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Food",
    date: todayString(),
    note: "",
  });

  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayString());

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [reminders, setReminders] = useState([]);
  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState(todayString());

  const [toast, setToast] = useState("");

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }, []);

  const addNotification = useCallback((message, type = "info") => {
    setNotifications((previous) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        date: new Date().toLocaleString(),
        read: false,
      },
      ...previous,
    ]);
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const result = await api.listTransactions();

      const list = Array.isArray(result)
        ? result
        : Array.isArray(result?.transactions)
          ? result.transactions
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.data?.transactions)
              ? result.data.transactions
              : [];

      setTransactions(list.map(normalizeTransaction));
    } catch (error) {
      console.error("Unable to load transactions:", error);
      setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load transactions. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const visibleTransactions = useMemo(() => {
    let result = [...transactions];

    if (activeNav === "Income") {
      result = result.filter((item) => item.type === "income");
    } else if (activeNav === "Expenses") {
      result = result.filter((item) => item.type === "expense");
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((item) =>
        [
          item.title,
          item.category,
          item.note,
          item.type,
          item.date,
        ].some((value) => String(value || "").toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "title-asc":
          return a.title.localeCompare(b.title);
        default:
          return b.date.localeCompare(a.date);
      }
    });

    return result;
  }, [transactions, activeNav, search, categoryFilter, sortBy]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpenses;

  const thisMonthTransactions = useMemo(() => {
    const prefix = todayString().slice(0, 7);
    return transactions.filter((item) => item.date.startsWith(prefix));
  }, [transactions]);

  const monthIncome = thisMonthTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const monthExpenses = thisMonthTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseCategories = useMemo(() => {
    const totals = {};

    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        totals[item.category] = (totals[item.category] || 0) + item.amount;
      });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    const totals = {};

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - offset);

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      totals[key] = {
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        income: 0,
        expenses: 0,
      };
    }

    transactions.forEach((item) => {
      const key = item.date.slice(0, 7);
      if (!totals[key]) return;

      if (item.type === "income") {
        totals[key].income += item.amount;
      } else {
        totals[key].expenses += item.amount;
      }
    });

    return Object.values(totals);
  }, [transactions]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= numberOfDays; day++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const dayTransactions = transactions.filter(
        (item) => item.date === date
      );

      cells.push({
        day,
        date,
        income: dayTransactions
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0),
        expenses: dayTransactions
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0),
        count: dayTransactions.length,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarMonth, transactions]);

  const selectedDateTransactions = useMemo(
    () =>
      transactions
        .filter((item) => item.date === selectedDate)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [transactions, selectedDate]
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  const goNav = (label) => {
    setActiveNav(label);
    setSearch("");
    setCategoryFilter("All");
    setSidebarOpen(false);
    setShowNotifications(false);
  };

  const openCreate = (type = "expense", date = todayString()) => {
    setEditingId(null);
    setFormError("");
    setForm({
      title: "",
      amount: "",
      type,
      category: type === "income" ? "Salary" : "Food",
      date,
      note: "",
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormError("");
    setForm({
      title: item.title,
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      date: item.date || todayString(),
      note: item.note || "",
    });
    setModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSaveTransaction = async (event) => {
    event.preventDefault();
    setFormError("");

    const amount = Number(form.amount);

    if (!form.title.trim()) {
      setFormError("Please enter a transaction title.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    if (!form.date) {
      setFormError("Please choose a transaction date.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.updateTransaction(editingId, payload);
        addNotification(`Updated transaction: ${payload.title}`, "success");
        notify("Transaction updated successfully.");
      } else {
        await api.createTransaction(payload);
        addNotification(`Added transaction: ${payload.title}`, "success");
        notify("Transaction added successfully.");
      }

      setModalOpen(false);
      await loadTransactions();
    } catch (error) {
      console.error("Unable to save transaction:", error);
      setFormError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save transaction. Please check the backend."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.deleteTransaction(item.id);
      addNotification(`Deleted transaction: ${item.title}`, "warning");
      notify("Transaction deleted.");
      await loadTransactions();
    } catch (error) {
      console.error("Unable to delete transaction:", error);
      notify(
        error?.response?.data?.message || "Unable to delete transaction."
      );
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Title", "Type", "Category", "Amount", "Date", "Note"],
      ...visibleTransactions.map((item) => [
        item.title,
        item.type,
        item.category,
        item.amount,
        item.date,
        item.note,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pennypilot-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);

    notify("CSV exported successfully.");
  };

  const changeCalendarMonth = (offset) => {
    setCalendarMonth(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + offset,
          1
        )
    );
  };

  const addReminder = (event) => {
    event.preventDefault();

    if (!reminderText.trim() || !reminderDate) {
      notify("Enter a reminder and choose a date.");
      return;
    }

    const reminder = {
      id: `${Date.now()}-${Math.random()}`,
      text: reminderText.trim(),
      date: reminderDate,
      done: false,
    };

    setReminders((previous) =>
      [...previous, reminder].sort((a, b) => a.date.localeCompare(b.date))
    );

    addNotification(`Reminder added: ${reminder.text}`, "success");
    setReminderText("");
    notify("Reminder added.");
  };

  const toggleReminder = (id) => {
    setReminders((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const deleteReminder = (id) => {
    setReminders((previous) => previous.filter((item) => item.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true }))
    );
  };

  const renderTransactionTable = (items, heading = "Recent transactions") => (
    <section className="pp-panel">
      <div className="pp-panel-heading">
        <div>
          <h2>{heading}</h2>
          <p className="pp-muted">
            {items.length} transaction{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <button className="pp-button pp-button-light" onClick={exportCSV}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No transactions found"
          message="Add a transaction or adjust your search and filters."
          action={
            <button
              className="pp-button pp-button-primary"
              onClick={() =>
                openCreate(
                  activeNav === "Income" ? "income" : "expense"
                )
              }
            >
              <Plus size={16} />
              Add transaction
            </button>
          }
        />
      ) : (
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Category</th>
                <th>Date</th>
                <th>Amount</th>
                <th className="pp-actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="pp-transaction-title">
                      <span
                        className={`pp-transaction-icon ${
                          item.type === "income" ? "is-income" : "is-expense"
                        }`}
                      >
                        {item.type === "income" ? (
                          <TrendingUp size={17} />
                        ) : (
                          <TrendingDown size={17} />
                        )}
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        {item.note && <small>{item.note}</small>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pp-category">{item.category}</span>
                  </td>
                  <td>{dateLabel(item.date)}</td>
                  <td
                    className={
                      item.type === "income"
                        ? "pp-amount-income"
                        : "pp-amount-expense"
                    }
                  >
                    {item.type === "income" ? "+" : "−"}
                    {money(item.amount)}
                  </td>
                  <td>
                    <div className="pp-row-actions">
                      <button
                        className="pp-icon-button"
                        title="Edit transaction"
                        aria-label="Edit transaction"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="pp-icon-button pp-delete-button"
                        title="Delete transaction"
                        aria-label="Delete transaction"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderOverview = () => (
    <>
      <div className="pp-stats-grid">
        <StatCard
          title="Total balance"
          value={balance}
          subtitle="Income minus expenses"
          icon={Wallet}
          tone="tone-purple"
        />
        <StatCard
          title="Total income"
          value={totalIncome}
          subtitle="All recorded income"
          icon={TrendingUp}
          tone="tone-green"
        />
        <StatCard
          title="Total expenses"
          value={totalExpenses}
          subtitle="All recorded expenses"
          icon={TrendingDown}
          tone="tone-red"
        />
        <StatCard
          title="This month's expenses"
          value={monthExpenses}
          subtitle={`${money(monthIncome)} income this month`}
          icon={PiggyBank}
          tone="tone-orange"
        />
      </div>

      <div className="pp-chart-grid">
        <section className="pp-panel">
          <div className="pp-panel-heading">
            <div>
              <h2>Income vs expenses</h2>
              <p className="pp-muted">Your last six months</p>
            </div>
            <span className="pp-chart-label">
              <span className="pp-dot dot-purple" /> Income
              <span className="pp-dot dot-green" /> Expenses
            </span>
          </div>

          <div className="pp-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#635bff" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#635bff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#18a999" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#18a999" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={65}
                  tickFormatter={(value) =>
                    value >= 1000 ? `₹${value / 1000}k` : `₹${value}`
                  }
                />
                <Tooltip formatter={(value) => money(value)} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#635bff"
                  fill="url(#incomeFill)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#18a999"
                  fill="url(#expenseFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="pp-panel">
          <div className="pp-panel-heading">
            <div>
              <h2>Expense breakdown</h2>
              <p className="pp-muted">Spending by category</p>
            </div>
          </div>

          {expenseCategories.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              message="Your category breakdown will appear after you add expenses."
            />
          ) : (
            <>
              <div className="pp-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pp-category-list">
                {expenseCategories.slice(0, 5).map((item, index) => (
                  <div className="pp-category-row" key={item.name}>
                    <span
                      className="pp-category-color"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                    <strong>{money(item.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {renderTransactionTable(
        [...transactions]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5),
        "Recent transactions"
      )}
    </>
  );

  const renderInsights = () => (
    <>
      <div className="pp-stats-grid">
        <StatCard
          title="Average expense"
          value={
            transactions.filter((item) => item.type === "expense").length
              ? totalExpenses /
                transactions.filter((item) => item.type === "expense").length
              : 0
          }
          subtitle="Per recorded expense"
          icon={BarChart3}
          tone="tone-purple"
        />
        <StatCard
          title="Savings rate"
          value={totalIncome > 0 ? (balance / totalIncome) * 100 : 0}
          subtitle="Income remaining after expenses"
          format="percent"
          icon={Sparkles}
          tone="tone-green"
        />
        <StatCard
          title="Transactions"
          value={transactions.length}
          subtitle="All recorded transactions"
          icon={ArrowLeftRight}
          tone="tone-orange"
        />
        <StatCard
          title="Net balance"
          value={balance}
          subtitle={balance >= 0 ? "Income is above expenses" : "Expenses are above income"}
          icon={Wallet}
          tone={balance >= 0 ? "tone-green" : "tone-red"}
        />
      </div>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h2>Monthly comparison</h2>
            <p className="pp-muted">Income and expenses by month</p>
          </div>
        </div>
        <div className="pp-chart pp-chart-tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `₹${value / 1000}k` : `₹${value}`
                }
              />
              <Tooltip formatter={(value) => money(value)} />
              <Bar dataKey="income" name="Income" fill="#635bff" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#18a999" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h2>Category details</h2>
            <p className="pp-muted">Total spending in each category</p>
          </div>
        </div>
        {expenseCategories.length === 0 ? (
          <EmptyState
            title="Nothing to analyse yet"
            message="Add expenses to see your spending insights."
          />
        ) : (
          <div className="pp-category-list pp-category-list-large">
            {expenseCategories.map((item, index) => {
              const percentage = totalExpenses
                ? (item.value / totalExpenses) * 100
                : 0;

              return (
                <div className="pp-insight-row" key={item.name}>
                  <div className="pp-insight-title">
                    <span
                      className="pp-category-color"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                    <strong>{money(item.value)}</strong>
                  </div>
                  <div className="pp-progress">
                    <div
                      style={{
                        width: `${percentage}%`,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <small className="pp-muted">{percentage.toFixed(1)}% of total expenses</small>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );

  const renderCalendar = () => (
    <>
      <section className="pp-panel">
        <div className="pp-panel-heading pp-calendar-heading">
          <div>
            <h2>Transaction calendar</h2>
            <p className="pp-muted">
              Select a date to view or add transactions
            </p>
          </div>
          <div className="pp-calendar-controls">
            <button
              className="pp-icon-button"
              aria-label="Previous month"
              onClick={() => changeCalendarMonth(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>{formatMonth(calendarMonth)}</strong>
            <button
              className="pp-icon-button"
              aria-label="Next month"
              onClick={() => changeCalendarMonth(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="pp-calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div className="pp-calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {calendarDays.map((cell, index) =>
            cell ? (
              <button
                key={cell.date}
                className={`pp-calendar-day ${
                  selectedDate === cell.date ? "is-selected" : ""
                } ${cell.date === todayString() ? "is-today" : ""}`}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span className="pp-calendar-day-number">{cell.day}</span>
                {cell.count > 0 && (
                  <span className="pp-calendar-indicators">
                    {cell.income > 0 && <i className="income-indicator" />}
                    {cell.expenses > 0 && <i className="expense-indicator" />}
                  </span>
                )}
                {cell.count > 0 && (
                  <small className="pp-calendar-amount">
                    {cell.expenses > 0
                      ? `−${money(cell.expenses)}`
                      : `+${money(cell.income)}`}
                  </small>
                )}
              </button>
            ) : (
              <div className="pp-calendar-day pp-calendar-blank" key={`blank-${index}`} />
            )
          )}
        </div>

        <div className="pp-calendar-legend">
          <span><i className="income-indicator" /> Income</span>
          <span><i className="expense-indicator" /> Expenses</span>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h2>{dateLabel(selectedDate)}</h2>
            <p className="pp-muted">
              {selectedDateTransactions.length} transaction
              {selectedDateTransactions.length === 1 ? "" : "s"} on this date
            </p>
          </div>
          <div className="pp-inline-actions">
            <button
              className="pp-button pp-button-light"
              onClick={() => openCreate("income", selectedDate)}
            >
              <Plus size={16} /> Income
            </button>
            <button
              className="pp-button pp-button-primary"
              onClick={() => openCreate("expense", selectedDate)}
            >
              <Plus size={16} /> Expense
            </button>
          </div>
        </div>

        {selectedDateTransactions.length === 0 ? (
          <EmptyState
            title="No transactions on this date"
            message="Add an income or expense to this selected date."
          />
        ) : (
          <div className="pp-selected-date-list">
            {selectedDateTransactions.map((item) => (
              <div className="pp-selected-date-item" key={item.id}>
                <div className="pp-transaction-title">
                  <span
                    className={`pp-transaction-icon ${
                      item.type === "income" ? "is-income" : "is-expense"
                    }`}
                  >
                    {item.type === "income" ? (
                      <TrendingUp size={17} />
                    ) : (
                      <TrendingDown size={17} />
                    )}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.category}</small>
                  </div>
                </div>
                <strong
                  className={
                    item.type === "income"
                      ? "pp-amount-income"
                      : "pp-amount-expense"
                  }
                >
                  {item.type === "income" ? "+" : "−"}
                  {money(item.amount)}
                </strong>
                <div className="pp-row-actions">
                  <button
                    className="pp-icon-button"
                    onClick={() => openEdit(item)}
                    aria-label="Edit transaction"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="pp-icon-button pp-delete-button"
                    onClick={() => handleDelete(item)}
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h2>Reminders</h2>
            <p className="pp-muted">Keep track of upcoming bills and payments</p>
          </div>
          <CalendarCheck size={21} />
        </div>

        <form className="pp-reminder-form" onSubmit={addReminder}>
          <input
            value={reminderText}
            onChange={(event) => setReminderText(event.target.value)}
            placeholder="e.g. Pay electricity bill"
            aria-label="Reminder description"
            required
          />
          <input
            type="date"
            value={reminderDate}
            onChange={(event) => setReminderDate(event.target.value)}
            aria-label="Reminder date"
            required
          />
          <button className="pp-button pp-button-primary" type="submit">
            <Plus size={16} /> Add reminder
          </button>
        </form>

        {reminders.length === 0 ? (
          <EmptyState
            title="No reminders yet"
            message="Add a reminder for bills, payments, or financial tasks."
          />
        ) : (
          <div className="pp-reminders-list">
            {reminders.map((reminder) => (
              <div className="pp-reminder-item" key={reminder.id}>
                <button
                  className={`pp-reminder-check ${reminder.done ? "is-done" : ""}`}
                  onClick={() => toggleReminder(reminder.id)}
                  aria-label={reminder.done ? "Mark as incomplete" : "Mark as complete"}
                >
                  {reminder.done && <Check size={15} />}
                </button>
                <div className={reminder.done ? "pp-reminder-done" : ""}>
                  <strong>{reminder.text}</strong>
                  <small>
                    <Clock size={13} /> {dateLabel(reminder.date)}
                    {reminder.date < todayString() && !reminder.done
                      ? " · Past due"
                      : ""}
                  </small>
                </div>
                <button
                  className="pp-icon-button pp-delete-button"
                  onClick={() => deleteReminder(reminder.id)}
                  aria-label="Delete reminder"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="pp-app">
      <style>{`
        :root {
          --pp-purple: #635bff;
          --pp-purple-dark: #5148ed;
          --pp-bg: #f6f7fb;
          --pp-text: #20243a;
          --pp-muted: #85899b;
          --pp-border: #eceef5;
          color-scheme: light;
          --page-bg: #f8fafc;
          --card: #ffffff;
          --text: #172033;
          --muted: #64748b;
          --border: #e2e8f0;

        }

        :root[data-theme="dark"] {
          color-scheme: dark;
          --page-bg: #111827;
          --card: #1f2937;
          --text: #f9fafb;
          --muted: #cbd5e1;
          --border: #374151;
        }
          
        .pp-app, .pp-app * { box-sizing: border-box; }
        .pp-app {
          min-height: 100vh; display: flex; background: var(--pp-bg);
          color: var(--pp-text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 14px;
        }
        .pp-app button, .pp-app input, .pp-app select, .pp-app textarea { font: inherit; }
        .pp-app button { cursor: pointer; }
        .pp-sidebar {
          width: 244px; flex: 0 0 244px; min-height: 100vh; background: #fff;
          border-right: 1px solid var(--pp-border); padding: 27px 17px;
          display: flex; flex-direction: column; z-index: 30;
        }
        .pp-brand { display:flex; align-items:center; gap:11px; padding:0 9px; margin-bottom:42px; }
        .pp-brand-mark {
          width:39px;height:39px;border-radius:13px;background:var(--pp-purple);
          color:#fff;display:grid;place-items:center;box-shadow:0 6px 16px #635bff35;
        }
        .pp-brand strong { font-size:20px;letter-spacing:-.7px; }
        .pp-brand small { display:block;color:var(--pp-muted);font-size:11px;margin-top:2px; }
        .pp-nav-label { color:#a0a3b2;font-size:10px;font-weight:800;letter-spacing:1.5px;padding:0 12px;margin-bottom:12px; }
        .pp-nav { display:grid; gap:5px; }
        .pp-nav-item {
          border:0;background:transparent;color:#777c91;display:flex;align-items:center;
          gap:12px;width:100%;text-align:left;padding:12px;border-radius:10px;font-weight:600;
        }
        .pp-nav-item:hover { background:#f6f5ff;color:var(--pp-purple); }
        .pp-nav-item.active { color:var(--pp-purple);background:#f0efff; }
        .pp-sidebar-bottom { margin-top:auto;padding:18px 10px 0;color:var(--pp-muted);font-size:12px;line-height:1.6; }
        .pp-sidebar-bottom strong { color:#464b62;display:block;margin-bottom:4px; }
        .pp-sidebar-bottom .pp-version { display:flex;align-items:center;gap:7px;margin-top:14px;font-size:11px; }
        .pp-sidebar-bottom .pp-version i { width:7px;height:7px;border-radius:50%;background:#17b890; }
        .pp-main { min-width:0;flex:1;padding:26px 32px 44px; }
        .pp-topbar { display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:29px; }
        .pp-page-title { margin:0;font-size:26px;letter-spacing:-.8px;font-weight:750; }
        .pp-page-subtitle { margin:7px 0 0;color:var(--pp-muted);font-size:13px; }
        .pp-topbar-actions { display:flex;align-items:center;gap:10px;position:relative; }
        .pp-button {
          display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:9px;
          padding:10px 14px;border:1px solid transparent;font-weight:650;white-space:nowrap;
          transition:background .15s,transform .15s;
        }
        .pp-button:disabled { opacity:.6;cursor:not-allowed; }
        .pp-button-primary { background:var(--pp-purple);color:#fff; }
        .pp-button-primary:hover { background:var(--pp-purple-dark); }
        .pp-button-light { background:#fff;border-color:var(--pp-border);color:#51566d; }
        .pp-button-light:hover { background:#f7f7ff; }
        .pp-icon-button { border:1px solid transparent;background:transparent;color:#747990;border-radius:8px;padding:7px;display:inline-grid;place-items:center; }
        .pp-icon-button:hover { background:#f0efff;color:var(--pp-purple); }
        .pp-delete-button:hover { background:#fff0f0;color:#d94b5b; }
        .pp-notification-wrap { position:relative; }
        .pp-bell-button { width:40px;height:40px;background:#fff;border:1px solid var(--pp-border);border-radius:10px;display:grid;place-items:center;color:#62677d;position:relative; }
        .pp-bell-count { position:absolute;right:-5px;top:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:10px;background:#ef5365;color:#fff;font-size:10px;display:grid;place-items:center;border:2px solid var(--pp-bg); }
        .pp-notification-panel { position:absolute;right:0;top:49px;width:min(350px,calc(100vw - 35px));background:#fff;border:1px solid var(--pp-border);border-radius:13px;box-shadow:0 16px 45px #20243a1c;z-index:50;overflow:hidden; }
        .pp-notification-head { display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid var(--pp-border); }
        .pp-notification-head strong { font-size:14px; }
        .pp-notification-list { max-height:320px;overflow:auto; }
        .pp-notification-item { padding:13px 16px;border-bottom:1px solid #f1f2f7;display:flex;gap:10px;align-items:flex-start; }
        .pp-notification-item.unread { background:#f8f7ff; }
        .pp-notification-item p { margin:0 0 5px;line-height:1.45; }
        .pp-notification-item small { color:var(--pp-muted);font-size:11px; }
        .pp-notification-dot { width:8px;height:8px;border-radius:50%;background:var(--pp-purple);margin-top:5px;flex-shrink:0; }
        .pp-notification-empty { padding:25px 15px;text-align:center;color:var(--pp-muted); }
        .pp-stats-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:20px; }
        .pp-stat-card { background:#fff;border:1px solid var(--pp-border);border-radius:14px;padding:19px 17px;display:flex;align-items:flex-start;gap:13px;min-width:0; }
        .pp-stat-icon { width:43px;height:43px;border-radius:12px;display:grid;place-items:center;flex-shrink:0; }
        .tone-purple { color:#635bff;background:#f0efff; }
        .tone-green { color:#0c9b7e;background:#e7f8f2; }
        .tone-red { color:#e75b6a;background:#fff0f0; }
        .tone-orange { color:#d88b12;background:#fff6e5; }
        .pp-stat-content { display:flex;flex-direction:column;gap:7px;min-width:0; }
        .pp-stat-content > span { font-size:12px;white-space:nowrap; }
        .pp-stat-content strong { font-size:clamp(17px,1.5vw,23px);letter-spacing:-.7px;overflow-wrap:anywhere; }
        .pp-stat-content small { color:var(--pp-muted);font-size:11px;line-height:1.4; }
        .pp-muted { color:var(--pp-muted); }
        .pp-chart-grid { display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,1fr);gap:18px;margin-bottom:20px; }
        .pp-panel { background:#fff;border:1px solid var(--pp-border);border-radius:14px;padding:21px;margin-bottom:20px;min-width:0; }
        .pp-panel-heading { display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:20px; }
        .pp-panel-heading h2 { margin:0;font-size:16px;letter-spacing:-.3px; }
        .pp-panel-heading p { margin:6px 0 0;font-size:12px; }
        .pp-chart { height:265px;width:100%; }
        .pp-chart-tall { height:340px; }
        .pp-pie-chart { height:190px;width:100%; }
        .pp-chart-label { display:flex;align-items:center;gap:6px;color:var(--pp-muted);font-size:11px;white-space:nowrap; }
        .pp-dot { display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:8px; }
        .dot-purple { background:#635bff; }.dot-green { background:#18a999; }
        .pp-category-list { display:grid;gap:13px; }
        .pp-category-row { display:flex;align-items:center;gap:9px;font-size:12px; }
        .pp-category-color { display:inline-block;width:9px;height:9px;border-radius:3px;flex-shrink:0; }
        .pp-category-row strong { margin-left:auto;font-size:12px; }
        .pp-table-wrap { overflow-x:auto;width:100%; }
        .pp-table { width:100%;border-collapse:collapse;text-align:left;white-space:nowrap; }
        .pp-table th { padding:12px 10px;color:#989bad;font-size:10px;text-transform:uppercase;letter-spacing:.8px;font-weight:700;border-bottom:1px solid var(--pp-border); }
        .pp-table td { padding:15px 10px;border-bottom:1px solid #f0f1f6;font-size:12px; }
        .pp-table tbody tr:last-child td { border-bottom:0; }
        .pp-transaction-title { display:flex;align-items:center;gap:10px;min-width:0; }
        .pp-transaction-icon { width:35px;height:35px;border-radius:10px;display:grid;place-items:center;flex-shrink:0; }
        .pp-transaction-icon.is-income { background:#e8f8f2;color:#0b9b7d; }
        .pp-transaction-icon.is-expense { background:#fff0f0;color:#e45b6b; }
        .pp-transaction-title > div { min-width:0; }
        .pp-transaction-title strong { display:block;font-size:12px;font-weight:650;max-width:220px;overflow:hidden;text-overflow:ellipsis; }
        .pp-transaction-title small { display:block;color:var(--pp-muted);font-size:11px;margin-top:4px;max-width:220px;overflow:hidden;text-overflow:ellipsis; }
        .pp-category { display:inline-block;padding:5px 9px;border-radius:7px;background:#f4f5fa;color:#73788c;font-size:11px; }
        .pp-amount-income { color:#079a7c;font-weight:700; }
        .pp-amount-expense { color:#e35b6a;font-weight:700; }
        .pp-row-actions { display:flex;align-items:center;gap:2px; }
        .pp-actions-column { width:95px; }
        .pp-empty { text-align:center;padding:30px 15px; }
        .pp-empty-icon { margin:0 auto 13px;width:49px;height:49px;border-radius:15px;background:#f1f0ff;color:var(--pp-purple);display:grid;place-items:center; }
        .pp-empty h3 { margin:0 0 7px;font-size:14px; }
        .pp-empty p { color:var(--pp-muted);margin:0 auto 17px;max-width:340px;line-height:1.55;font-size:12px; }
        .pp-toolbar { display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap; }
        .pp-search { position:relative;flex:1;min-width:180px;max-width:380px; }
        .pp-search svg { position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#a0a3b2; }
        .pp-search input { width:100%;padding:11px 12px 11px 38px;border:1px solid var(--pp-border);border-radius:9px;background:#fff;outline:none; }
        .pp-search input:focus,.pp-form-field input:focus,.pp-form-field select:focus,.pp-form-field textarea:focus,.pp-reminder-form input:focus { border-color:#9e98ff;box-shadow:0 0 0 3px #635bff14; }
        .pp-toolbar-filters { display:flex;gap:9px;flex-wrap:wrap; }
        .pp-toolbar-filters select { padding:10px 12px;background:#fff;border:1px solid var(--pp-border);border-radius:9px;color:#555a70;outline:none; }
        .pp-error { padding:13px 15px;border:1px solid #ffd5d8;background:#fff4f4;color:#b73b4c;border-radius:10px;margin-bottom:17px;display:flex;align-items:center;gap:10px;line-height:1.5; }
        .pp-error button { margin-left:auto;background:transparent;border:0;color:inherit;font-weight:700; }
        .pp-loading { padding:38px 12px;text-align:center;color:var(--pp-muted); }
        .pp-loading svg { animation:pp-spin 1s linear infinite; }
        @keyframes pp-spin { to { transform:rotate(360deg); } }
        .pp-calendar-heading { flex-wrap:wrap; }
        .pp-calendar-controls { display:flex;align-items:center;gap:12px; }
        .pp-calendar-controls strong { min-width:135px;text-align:center;font-size:13px; }
        .pp-calendar-grid { display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px; }
        .pp-calendar-weekday { text-align:center;padding:8px 2px;color:#9296a8;font-size:11px;font-weight:700; }
        .pp-calendar-day { border:1px solid #eff0f6;border-radius:9px;min-height:83px;padding:8px;background:#fff;text-align:left;color:#42465c;display:flex;flex-direction:column;gap:5px;overflow:hidden; }
        .pp-calendar-day:hover { border-color:#c4c0ff;background:#faf9ff; }
        .pp-calendar-day.is-selected { border:2px solid var(--pp-purple);background:#f5f4ff;padding:7px; }
        .pp-calendar-day.is-today .pp-calendar-day-number { color:var(--pp-purple);font-weight:800; }
        .pp-calendar-day-number { font-size:12px;font-weight:600; }
        .pp-calendar-indicators { display:flex;gap:4px; }
        .income-indicator,.expense-indicator { display:inline-block;width:7px;height:7px;border-radius:50%; }
        .income-indicator { background:#18a999; }.expense-indicator { background:#f16b6b; }
        .pp-calendar-amount { color:#747990;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .pp-calendar-blank { background:#fafbfe;border-color:#f5f5f9;cursor:default; }
        .pp-calendar-legend { display:flex;gap:16px;margin-top:15px;color:var(--pp-muted);font-size:11px; }
        .pp-calendar-legend span { display:flex;align-items:center;gap:6px; }
        .pp-selected-date-list { display:grid; }
        .pp-selected-date-item { display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:18px;padding:13px 0;border-bottom:1px solid #f0f1f6; }
        .pp-selected-date-item:last-child { border-bottom:0; }
        .pp-inline-actions { display:flex;gap:8px;flex-wrap:wrap; }
        .pp-reminder-form { display:grid;grid-template-columns:minmax(0,1fr) 170px auto;gap:9px;margin-bottom:20px; }
        .pp-reminder-form input { min-width:0;padding:11px 12px;border:1px solid var(--pp-border);border-radius:9px;outline:none; }
        .pp-reminders-list { display:grid; }
        .pp-reminder-item { display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #f0f1f6; }
        .pp-reminder-item:last-child { border-bottom:0; }
        .pp-reminder-item > div { flex:1;min-width:0; }
        .pp-reminder-item strong { display:block;font-size:13px; }
        .pp-reminder-item small { display:flex;align-items:center;gap:5px;color:var(--pp-muted);font-size:11px;margin-top:5px; }
        .pp-reminder-check { width:24px;height:24px;border:1px solid #dcddea;border-radius:7px;background:#fff;color:#fff;display:grid;place-items:center;flex-shrink:0; }
        .pp-reminder-check.is-done { background:#18a999;border-color:#18a999; }
        .pp-reminder-done strong { text-decoration:line-through;color:#9b9eae; }
        .pp-category-list-large { gap:20px; }
        .pp-insight-title { display:flex;align-items:center;gap:9px;font-size:12px; }
        .pp-insight-title strong { margin-left:auto; }
        .pp-progress { height:7px;background:#f0f1f6;border-radius:8px;margin:9px 0 6px;overflow:hidden; }
        .pp-progress > div { height:100%;border-radius:8px; }
        .pp-modal-backdrop { position:fixed;inset:0;background:#15172d7a;z-index:100;display:grid;place-items:center;padding:18px;overflow-y:auto; }
        .pp-modal { width:min(500px,100%);background:#fff;border-radius:17px;box-shadow:0 24px 80px #0002;padding:25px; }
        .pp-modal-heading { display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:23px; }
        .pp-modal-heading h2 { margin:0;font-size:20px;letter-spacing:-.5px; }
        .pp-modal-heading p { margin:7px 0 0;color:var(--pp-muted);font-size:12px; }
        .pp-form-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
        .pp-form-field { display:flex;flex-direction:column;gap:7px;min-width:0; }
        .pp-form-field.full { grid-column:1/-1; }
        .pp-form-field label { font-size:12px;color:#5c6176;font-weight:650; }
        .pp-form-field input,.pp-form-field select,.pp-form-field textarea { width:100%;padding:11px 12px;border:1px solid #e5e7f0;border-radius:9px;outline:none;background:#fff;min-width:0; }
        .pp-form-field textarea { resize:vertical;min-height:75px; }
        .pp-type-toggle { display:grid;grid-template-columns:1fr 1fr;gap:8px; }
        .pp-type-toggle button { padding:10px;border:1px solid var(--pp-border);border-radius:9px;background:#fff;color:#747990;font-weight:650; }
        .pp-type-toggle button.selected.income { background:#eaf8f3;color:#07896f;border-color:#b8ead9; }
        .pp-type-toggle button.selected.expense { background:#fff0f0;color:#d84c5c;border-color:#ffcfd4; }
        .pp-modal-footer { display:flex;justify-content:flex-end;gap:9px;margin-top:23px; }
        .pp-form-error { padding:10px 12px;background:#fff0f0;border-radius:8px;color:#b73b4c;font-size:12px;margin-top:14px;line-height:1.5; }
        .pp-toast { position:fixed;bottom:22px;right:22px;z-index:120;background:#20243a;color:#fff;border-radius:11px;padding:13px 17px;box-shadow:0 10px 35px #0002;font-size:13px;max-width:calc(100vw - 40px); }
        .pp-mobile-menu { display:none; }
        .pp-mobile-overlay { display:none; }

        :root[data-theme="dark"] .pp-app {
          --pp-bg: #111827;
          --pp-text: #f3f4f6;
          --pp-muted: #aeb8c8;
          --pp-border: #374151;
          background: var(--pp-bg);
          color: var(--pp-text);
        }
        :root[data-theme="dark"] .pp-sidebar,
        :root[data-theme="dark"] .pp-panel,
        :root[data-theme="dark"] .pp-stat-card,
        :root[data-theme="dark"] .pp-modal,
        :root[data-theme="dark"] .pp-notification-panel {
          background: #1f2937;
          color: #f3f4f6;
          border-color: #374151;
        }
        :root[data-theme="dark"] .pp-button-light,
        :root[data-theme="dark"] .pp-bell-button,
        :root[data-theme="dark"] .pp-mobile-menu,
        :root[data-theme="dark"] .pp-search input,
        :root[data-theme="dark"] .pp-toolbar-filters select,
        :root[data-theme="dark"] .pp-form-field input,
        :root[data-theme="dark"] .pp-form-field select,
        :root[data-theme="dark"] .pp-form-field textarea,
        :root[data-theme="dark"] .pp-reminder-form input,
        :root[data-theme="dark"] .pp-type-toggle button,
        :root[data-theme="dark"] .pp-reminder-check {
          background: #111827;
          color: #f3f4f6;
          border-color: #374151;
        }
        :root[data-theme="dark"] .pp-nav-item { color: #cbd5e1; }
        :root[data-theme="dark"] .pp-nav-item:hover,
        :root[data-theme="dark"] .pp-nav-item.active { background: #312e81; color: #c4b5fd; }
        :root[data-theme="dark"] .pp-sidebar-bottom strong,
        :root[data-theme="dark"] .pp-form-field label { color: #e5e7eb; }
        :root[data-theme="dark"] .pp-table td,
        :root[data-theme="dark"] .pp-selected-date-item,
        :root[data-theme="dark"] .pp-reminder-item,
        :root[data-theme="dark"] .pp-notification-item,
        :root[data-theme="dark"] .pp-notification-head { border-color: #374151; }
        :root[data-theme="dark"] .pp-table td { border-bottom-color: #374151; }
        :root[data-theme="dark"] .pp-table th { border-bottom-color: #374151; color: #aeb8c8; }
        :root[data-theme="dark"] .pp-category { background: #374151; color: #e5e7eb; }
        :root[data-theme="dark"] .pp-calendar-day { background: #1f2937; color: #f3f4f6; border-color: #374151; }
        :root[data-theme="dark"] .pp-calendar-day.is-selected { background: #312e81; }
        :root[data-theme="dark"] .pp-calendar-blank { background: #111827; }
        :root[data-theme="dark"] .pp-calendar-amount { color: #cbd5e1; }
        :root[data-theme="dark"] .pp-progress { background: #374151; }
        :root[data-theme="dark"] .pp-notification-item.unread { background: #312e81; }
        :root[data-theme="dark"] .pp-form-error { background: #451a24; color: #fecdd3; }
        :root[data-theme="dark"] .pp-error { background: #451a24; border-color: #7f1d1d; color: #fecaca; }
        :root[data-theme="dark"] .pp-calendar-day:hover { background: #312e81; }
        :root[data-theme="dark"] .pp-type-toggle button.selected.income { background: #064e3b; color: #a7f3d0; }
        :root[data-theme="dark"] .pp-type-toggle button.selected.expense { background: #7f1d1d; color: #fecaca; }
        :root[data-theme="dark"] .pp-empty-icon { background: #312e81; }

        @media (max-width:1200px) {
          .pp-main { padding:23px 22px 38px; }
          .pp-stats-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .pp-chart-grid { grid-template-columns:minmax(0,1fr); }
          .pp-stat-content strong { font-size:22px; }
        }
        @media (max-width:760px) {
          .pp-sidebar { position:fixed;left:0;top:0;bottom:0;transform:translateX(-105%);transition:transform .2s;box-shadow:none; }
          .pp-sidebar.is-open { transform:translateX(0);box-shadow:12px 0 45px #20243a22; }
          .pp-mobile-overlay.is-visible { display:block;position:fixed;inset:0;background:#16182d66;z-index:25; }
          .pp-mobile-menu { display:grid;place-items:center;width:39px;height:39px;border:1px solid var(--pp-border);background:#fff;border-radius:9px;color:#656a80;flex-shrink:0; }
          .pp-main { padding:19px 14px 30px;width:100%; }
          .pp-topbar { align-items:flex-start;gap:10px;margin-bottom:22px; }
          .pp-topbar-left { display:flex;gap:10px;align-items:flex-start;min-width:0; }
          .pp-page-title { font-size:21px; }
          .pp-page-subtitle { font-size:11px;line-height:1.5; }
          .pp-topbar-actions { gap:6px; }
          .pp-topbar-actions > .pp-button { padding:9px 10px;font-size:12px; }
          .pp-stats-grid { gap:10px; }
          .pp-stat-card { padding:13px 11px;gap:9px; }
          .pp-stat-icon { width:34px;height:34px;border-radius:9px; }
          .pp-stat-content { gap:5px; }
          .pp-stat-content > span { white-space:normal;font-size:11px; }
          .pp-stat-content strong { font-size:17px; }
          .pp-stat-content small { font-size:10px; }
          .pp-panel { padding:15px 12px;margin-bottom:14px; }
          .pp-panel-heading { align-items:flex-start; }
          .pp-panel-heading h2 { font-size:14px; }
          .pp-chart { height:235px; }
          .pp-pie-chart { height:180px; }
          .pp-chart-label { font-size:10px;gap:4px; }
          .pp-toolbar { align-items:stretch; }
          .pp-search { max-width:none; }
          .pp-toolbar-filters { width:100%; }
          .pp-toolbar-filters select { flex:1;min-width:0; }
          .pp-calendar-grid { gap:3px; }
          .pp-calendar-day { min-height:65px;padding:5px 3px;border-radius:6px;gap:5px; }
          .pp-calendar-day.is-selected { padding:4px 2px; }
          .pp-calendar-day-number { font-size:11px; }
          .pp-calendar-amount { font-size:8px; }
          .pp-calendar-controls { gap:4px; }
          .pp-calendar-controls strong { min-width:110px;font-size:12px; }
          .pp-reminder-form { grid-template-columns:1fr; }
          .pp-reminder-form .pp-button { width:100%; }
          .pp-selected-date-item { grid-template-columns:minmax(0,1fr) auto;gap:8px; }
          .pp-selected-date-item .pp-row-actions { grid-column:2; }
          .pp-form-grid { grid-template-columns:1fr; }
          .pp-form-field.full { grid-column:auto; }
          .pp-modal { padding:19px; }
          .pp-chart-tall { height:280px; }
        }
        @media (max-width:390px) {
          .pp-topbar-actions > .pp-button { font-size:0;gap:0;padding:10px; }
          .pp-topbar-actions > .pp-button svg { width:18px;height:18px; }
          .pp-stat-icon { display:none; }
          .pp-stat-card { padding:12px 9px; }
          .pp-calendar-amount { display:none; }
          .pp-calendar-day { min-height:49px; }
        }
      `}</style>

      <div
        className={`pp-mobile-overlay ${sidebarOpen ? "is-visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`pp-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="pp-brand">
          <div className="pp-brand-mark">
            <Wallet size={22} />
          </div>
          <div>
            <strong>PennyPilot</strong>
            <small>Personal finance</small>
          </div>
        </div>

        <div className="pp-nav-label">WORKSPACE</div>
        <nav className="pp-nav">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`pp-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => goNav(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="pp-sidebar-bottom">
          <strong>Take control of your money.</strong>
          Track your spending, plan ahead, and build better financial habits.
          <div className="pp-version">
            <i />
            PennyPilot · Expense Tracker
          </div>
        </div>
      </aside>

      <main className="pp-main">
        <header className="pp-topbar">
          <div className="pp-topbar-left">
            <button
              className="pp-mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div>
              <h1 className="pp-page-title">
                {activeNav === "Overview"
                  ? "Financial overview"
                  : activeNav === "Insights"
                    ? "Financial insights"
                    : activeNav === "Calendar"
                      ? "Your calendar"
                      : activeNav === "Income"
                        ? "Income"
                        : activeNav === "Expenses"
                          ? "Expenses"
                          : "Transactions"}
              </h1>
              <p className="pp-page-subtitle">
                {activeNav === "Overview"
                  ? "Here's what's happening with your money."
                  : activeNav === "Calendar"
                    ? "Manage your transactions by date."
                    : activeNav === "Insights"
                      ? "Understand your spending habits."
                      : `Manage your ${activeNav.toLowerCase()} in one place.`}
              </p>
            </div>
          </div>

          <div className="pp-topbar-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="pp-notification-wrap">
              <button
                className="pp-bell-button"
                aria-label="Notifications"
                onClick={() => setShowNotifications((previous) => !previous)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="pp-bell-count">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="pp-notification-panel">
                  <div className="pp-notification-head">
                    <strong>Notifications</strong>
                    <div className="pp-inline-actions">
                      {notifications.length > 0 && (
                        <button
                          className="pp-icon-button"
                          title="Mark all as read"
                          onClick={markAllNotificationsRead}
                        >
                          <CheckCheck size={17} />
                        </button>
                      )}
                      <button
                        className="pp-icon-button"
                        aria-label="Close notifications"
                        onClick={() => setShowNotifications(false)}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="pp-notification-list">
                    {notifications.length === 0 ? (
                      <div className="pp-notification-empty">
                        <Bell size={22} />
                        <p>No notifications yet.</p>
                        <small>Transaction activity will appear here.</small>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          className={`pp-notification-item ${
                            item.read ? "" : "unread"
                          }`}
                          key={item.id}
                        >
                          <span className="pp-notification-dot" />
                          <div>
                            <p>{item.message}</p>
                            <small>{item.date}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              className="pp-button pp-button-primary"
              onClick={() =>
                openCreate(
                  activeNav === "Income" ? "income" : "expense",
                  activeNav === "Calendar" ? selectedDate : todayString()
                )
              }
            >
              <Plus size={17} />
              Add new
            </button>
          </div>
        </header>

        {loadError && (
          <div className="pp-error">
            <CircleAlert size={19} />
            <div>
              <strong>Unable to load transactions.</strong>
              <div>{loadError}</div>
            </div>
            <button onClick={loadTransactions}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="pp-panel pp-loading">
            <RefreshCw size={22} />
            <p>Loading your transactions...</p>
          </div>
        ) : (
          <>
            {activeNav === "Overview" && renderOverview()}

            {(activeNav === "Income" ||
              activeNav === "Expenses" ||
              activeNav === "Transactions") && (
              <>
                <div className="pp-stats-grid">
                  <StatCard
                    title={
                      activeNav === "Income"
                        ? "Total income"
                        : activeNav === "Expenses"
                          ? "Total expenses"
                          : "Total balance"
                    }
                    value={
                      activeNav === "Income"
                        ? totalIncome
                        : activeNav === "Expenses"
                          ? totalExpenses
                          : balance
                    }
                    subtitle="Across all recorded transactions"
                    icon={
                      activeNav === "Income"
                        ? TrendingUp
                        : activeNav === "Expenses"
                          ? TrendingDown
                          : Wallet
                    }
                    tone={
                      activeNav === "Expenses"
                        ? "tone-red"
                        : activeNav === "Income"
                          ? "tone-green"
                          : "tone-purple"
                    }
                  />
                  <StatCard
                    title="This month's income"
                    value={monthIncome}
                    subtitle="Current calendar month"
                    icon={TrendingUp}
                    tone="tone-green"
                  />
                  <StatCard
                    title="This month's expenses"
                    value={monthExpenses}
                    subtitle="Current calendar month"
                    icon={TrendingDown}
                    tone="tone-orange"
                  />
                  <StatCard
                    title="Transactions"
                    value={
                      activeNav === "Income"
                        ? transactions.filter((item) => item.type === "income").length
                        : activeNav === "Expenses"
                          ? transactions.filter((item) => item.type === "expense").length
                          : transactions.length
                    }
                    subtitle="Recorded entries"
                    icon={ArrowLeftRight}
                    tone="tone-purple"
                  />
                </div>

                <section className="pp-panel">
                  <div className="pp-toolbar">
                    <div className="pp-search">
                      <Search size={17} />
                      <input
                        type="search"
                        placeholder="Search title, category, notes..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search transactions"
                      />
                    </div>

                    <div className="pp-toolbar-filters">
                      <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        aria-label="Filter by category"
                      >
                        <option value="All">All categories</option>
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>

                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        aria-label="Sort transactions"
                      >
                        <option value="date-desc">Newest first</option>
                        <option value="date-asc">Oldest first</option>
                        <option value="amount-desc">Amount: high to low</option>
                        <option value="amount-asc">Amount: low to high</option>
                        <option value="title-asc">Title: A to Z</option>
                      </select>

                      <button
                        className="pp-button pp-button-light"
                        onClick={() => {
                          setSearch("");
                          setCategoryFilter("All");
                          setSortBy("date-desc");
                        }}
                      >
                        <Filter size={15} />
                        Reset
                      </button>
                    </div>
                  </div>

                  {renderTransactionTable(
                    visibleTransactions,
                    `${activeNav} list`
                  )}
                </section>
              </>
            )}

            {activeNav === "Calendar" && renderCalendar()}

            {activeNav === "Insights" && renderInsights()}
          </>
        )}
      </main>

      {modalOpen && (
        <div
          className="pp-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="pp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pp-modal-title"
          >
            <div className="pp-modal-heading">
              <div>
                <h2 id="pp-modal-title">
                  {editingId ? "Edit transaction" : "Add transaction"}
                </h2>
                <p>Enter the details for this financial record.</p>
              </div>
              <button
                className="pp-icon-button"
                aria-label="Close form"
                onClick={() => setModalOpen(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="pp-form-grid">
                <div className="pp-form-field full">
                  <label>Transaction type</label>
                  <div className="pp-type-toggle">
                    <button
                      type="button"
                      className={form.type === "income" ? "selected income" : ""}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          type: "income",
                          category:
                            previous.type === "expense" &&
                            previous.category === "Food"
                              ? "Salary"
                              : previous.category,
                        }))
                      }
                    >
                      <TrendingUp size={15} />
                      Income
                    </button>
                    <button
                      type="button"
                      className={form.type === "expense" ? "selected expense" : ""}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          type: "expense",
                          category:
                            previous.type === "income" &&
                            previous.category === "Salary"
                              ? "Food"
                              : previous.category,
                        }))
                      }
                    >
                      <TrendingDown size={15} />
                      Expense
                    </button>
                  </div>
                </div>

                <div className="pp-form-field full">
                  <label htmlFor="pp-title">Title *</label>
                  <input
                    id="pp-title"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Grocery shopping"
                    maxLength={120}
                    required
                  />
                </div>

                <div className="pp-form-field">
                  <label htmlFor="pp-amount">Amount (₹) *</label>
                  <input
                    id="pp-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="pp-form-field">
                  <label htmlFor="pp-category">Category *</label>
                  <select
                    id="pp-category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pp-form-field full">
                  <label htmlFor="pp-date">Date *</label>
                  <input
                    id="pp-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="pp-form-field full">
                  <label htmlFor="pp-note">Notes (optional)</label>
                  <textarea
                    id="pp-note"
                    name="note"
                    value={form.note}
                    onChange={handleFormChange}
                    placeholder="Add any additional details..."
                    maxLength={500}
                  />
                </div>
              </div>

              {formError && (
                <div className="pp-form-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="pp-modal-footer">
                <button
                  type="button"
                  className="pp-button pp-button-light"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pp-button pp-button-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {editingId ? "Save changes" : "Save transaction"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="pp-toast">{toast}</div>}
    </div>
  );
}

export default App;
