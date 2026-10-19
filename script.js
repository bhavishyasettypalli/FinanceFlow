// ========================================
// FINANCEFLOW - PERSONAL FINANCE TRACKER
// ========================================

const TRANSACTIONS_KEY = "financeTransactions";
const BUDGETS_KEY = "financeBudgets";

const $ = (id) => document.getElementById(id);

// ========================================
// STORAGE
// ========================================

function readStorage(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

let transactions = readStorage(TRANSACTIONS_KEY, []);
let budgets = readStorage(BUDGETS_KEY, []);
let editingId = null;

function saveTransactions() {
  localStorage.setItem(
    TRANSACTIONS_KEY,
    JSON.stringify(transactions)
  );
}

function saveBudgets() {
  localStorage.setItem(
    BUDGETS_KEY,
    JSON.stringify(budgets)
  );
}

// ========================================
// HELPER FUNCTIONS
// ========================================

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function selectedMonth() {
  return $("reportMonth").value || localDateString().slice(0, 7);
}

function monthTransactions(month = selectedMonth()) {
  return transactions.filter((item) =>
    item.date?.startsWith(month)
  );
}

function monthName(month) {
  const [year, number] = month.split("-").map(Number);

  return new Date(year, number - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "2-digit"
    }
  );
}

function sumByType(items, type) {
  return items
    .filter((item) => item.type === type)
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// ========================================
// SUMMARY CARDS
// ========================================

function renderSummary() {
  const items = monthTransactions();

  const income = sumByType(items, "income");
  const expenses = sumByType(items, "expense");

  $("totalIncome").textContent = money(income);
  $("totalExpenses").textContent = money(expenses);
  $("monthlySavings").textContent = money(income - expenses);

  // Total balance includes all transactions.
  const allIncome = sumByType(transactions, "income");
  const allExpenses = sumByType(transactions, "expense");

  $("totalBalance").textContent = money(
    allIncome - allExpenses
  );
}

// ========================================
// INCOME AND EXPENSE COMPARISON CHART
// ========================================

function renderComparison() {
  const items = monthTransactions();

  const income = sumByType(items, "income");
  const expenses = sumByType(items, "expense");

  const maximum = Math.max(income, expenses, 1);

  const bars = [
    {
      label: "Income",
      amount: income,
      type: "income"
    },
    {
      label: "Expenses",
      amount: expenses,
      type: "expense"
    }
  ];

  $("comparisonChart").innerHTML = bars.map((bar) => `
    <div class="bar-row">
      <span class="bar-label">${bar.label}</span>

      <div>
        <div class="bar-track">
          <div
            class="bar-fill ${bar.type}-fill"
            style="width:${(bar.amount / maximum) * 100}%"
          ></div>
        </div>

        <div class="bar-value">
          ${money(bar.amount)}
        </div>
      </div>
    </div>
  `).join("");
}

// ========================================
// EXPENSE CATEGORY CHART
// ========================================

function renderCategoryChart() {
  const expenses = monthTransactions().filter(
    (item) => item.type === "expense"
  );

  const totals = {};

  expenses.forEach((item) => {
    const category = item.category || "Other";

    totals[category] =
      (totals[category] || 0) + Number(item.amount || 0);
  });

  const entries = Object.entries(totals).sort(
    (a, b) => b[1] - a[1]
  );

  const maximum = Math.max(
    ...entries.map((entry) => entry[1]),
    1
  );

  if (!entries.length) {
    $("categoryChart").innerHTML =
      '<p class="empty-state">No expenses for this month yet.</p>';

    return;
  }

  $("categoryChart").innerHTML = entries.map(
    ([category, amount]) => `
      <div class="category-row">
        <div class="category-label">
          <strong>${escapeHtml(category)}</strong>
          <span>${money(amount)}</span>
        </div>

        <div class="bar-track">
          <div
            class="bar-fill category-fill"
            style="width:${(amount / maximum) * 100}%"
          ></div>
        </div>
      </div>
    `
  ).join("");
}

// ========================================
// SIX-MONTH TREND CHART
// ========================================

function renderTrendChart() {
  const [year, month] = selectedMonth().split("-").map(Number);
  const months = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(year, month - 1 - offset, 1);

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    const items = monthTransactions(key);

    months.push({
      key,
      label: monthName(key),
      income: sumByType(items, "income"),
      expenses: sumByType(items, "expense")
    });
  }

  const maximum = Math.max(
    ...months.flatMap((item) => [
      item.income,
      item.expenses
    ]),
    1
  );

  $("trendChart").innerHTML = months.map((item) => {
    const incomeHeight = item.income
      ? Math.max(3, item.income / maximum * 100)
      : 0;

    const expenseHeight = item.expenses
      ? Math.max(3, item.expenses / maximum * 100)
      : 0;

    return `
      <div
        class="trend-month"
        title="${item.label}: Income ${money(item.income)}, Expenses ${money(item.expenses)}"
      >
        <div class="trend-bars">
          <div
            class="trend-bar income-fill"
            style="height:${incomeHeight}%"
          ></div>

          <div
            class="trend-bar expense-fill"
            style="height:${expenseHeight}%"
          ></div>
        </div>

        <div class="trend-label">
          ${item.label}
        </div>
      </div>
    `;
  }).join("");
}

// ========================================
// BUDGETS
// ========================================

function renderBudgets() {
  const items = monthTransactions().filter(
    (item) => item.type === "expense"
  );

  if (!budgets.length) {
    $("budgetList").innerHTML =
      '<p class="empty-state">No budgets yet. Add a category budget above.</p>';

    return;
  }

  $("budgetList").innerHTML = budgets.map((budget) => {
    const spent = items
      .filter((item) => item.category === budget.category)
      .reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

    const limit = Number(budget.amount) || 0;

    const percent = limit > 0
      ? spent / limit * 100
      : 0;

    const width = Math.min(percent, 100);

    const statusClass =
      percent >= 100
        ? "over"
        : percent >= 75
          ? "warning"
          : "";

    let status = `${percent.toFixed(0)}% used`;

    if (percent > 100) {
      status += ` · ${money(spent - limit)} over budget`;
    } else {
      status += ` · ${money(limit - spent)} remaining`;
    }

    return `
      <div class="budget-item">
        <div class="budget-item-header">
          <strong>${escapeHtml(budget.category)}</strong>
          <span>${money(spent)} / ${money(limit)}</span>
        </div>

        <div class="progress-track">
          <div
            class="progress-fill budget-fill ${statusClass}"
            style="width:${width}%"
          ></div>
        </div>

        <small>${status}</small>

        <button
          type="button"
          class="button secondary small-button"
          data-delete-budget="${escapeHtml(budget.category)}"
        >
          Remove budget
        </button>
      </div>
    `;
  }).join("");
}

// ========================================
// TRANSACTION LIST
// ========================================

function renderTransactions() {
  const search = $("searchInput").value.trim().toLowerCase();
  const type = $("filterType").value;

  const filtered = monthTransactions()
    .filter((item) => {
      const matchesType =
        type === "all" || item.type === type;

      const matchesSearch = [
        item.description,
        item.category,
        item.date,
        item.type
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

      return matchesType && matchesSearch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!filtered.length) {
    $("transactionList").innerHTML =
      '<p class="empty-state">No matching transactions for this month.</p>';

    return;
  }

  $("transactionList").innerHTML = filtered.map((item) => `
    <div class="transaction-item">
      <div class="transaction-top">
        <div>
          <div class="transaction-title">
            ${escapeHtml(item.description)}
          </div>

          <div class="transaction-meta">
            ${escapeHtml(item.category)} · ${escapeHtml(item.date)}
          </div>
        </div>

        <span class="transaction-amount ${item.type}">
          ${item.type === "income" ? "+" : "−"}${money(item.amount)}
        </span>
      </div>

      <div class="transaction-bottom">
        <span class="transaction-meta">
          ${item.type === "income" ? "Income" : "Expense"}
        </span>

        <div class="transaction-actions">
          <button
            class="button secondary small-button"
            data-edit="${escapeHtml(item.id)}"
          >
            Edit
          </button>

          <button
            class="button secondary small-button"
            data-delete="${escapeHtml(item.id)}"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// ========================================
// RENDER EVERYTHING
// ========================================

function renderAll() {
  renderSummary();
  renderComparison();
  renderCategoryChart();
  renderTrendChart();
  renderBudgets();
  renderTransactions();
}

// ========================================
// TRANSACTION FORM
// ========================================

function resetTransactionForm() {
  editingId = null;

  $("transactionForm").reset();
  $("date").value = localDateString();

  $("formHeading").textContent = "Add Transaction";
  $("saveTransaction").textContent = "Add Transaction";

  $("cancelEdit").classList.add("hidden");
}

$("transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const description = $("description").value.trim();
  const amount = Number($("amount").value);
  const date = $("date").value;

  if (
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !date
  ) {
    alert(
      "Please enter a description, a valid positive amount, and a date."
    );

    return;
  }

  const existing = editingId
    ? transactions.find((item) => item.id === editingId)
    : null;

  const transaction = {
    id: editingId ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: $("type").value,
    description,
    amount,
    category: $("category").value,
    date
  };

  if (existing) {
    transactions = transactions.map((item) =>
      item.id === editingId ? transaction : item
    );
  } else {
    transactions.push(transaction);
  }

  saveTransactions();

  $("reportMonth").value = date.slice(0, 7);

  resetTransactionForm();
  renderAll();
});

$("cancelEdit").addEventListener(
  "click",
  resetTransactionForm
);

// ========================================
// EDIT AND DELETE TRANSACTIONS
// ========================================

$("transactionList").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const item = transactions.find(
      (transaction) =>
        transaction.id === editButton.dataset.edit
    );

    if (!item) return;

    editingId = item.id;

    $("type").value = item.type;
    $("description").value = item.description;
    $("amount").value = item.amount;
    $("category").value = item.category;
    $("date").value = item.date;

    $("formHeading").textContent = "Edit Transaction";
    $("saveTransaction").textContent = "Save Changes";

    $("cancelEdit").classList.remove("hidden");

    $("transactionForm").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (deleteButton) {
    const id = deleteButton.dataset.delete;

    if (!confirm("Delete this transaction?")) return;

    transactions = transactions.filter(
      (item) => item.id !== id
    );

    saveTransactions();

    if (editingId === id) {
      resetTransactionForm();
    }

    renderAll();
  }
});

// ========================================
// ADD OR UPDATE BUDGET
// ========================================

$("budgetForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const category = $("budgetCategory").value;
  const amount = Number($("budgetAmount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter a budget amount greater than zero.");
    return;
  }

  const existing = budgets.find(
    (item) => item.category === category
  );

  if (existing) {
    existing.amount = amount;
  } else {
    budgets.push({ category, amount });
  }

  saveBudgets();

  $("budgetAmount").value = "";

  renderBudgets();
});

// ========================================
// DELETE BUDGET
// ========================================

$("budgetList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-budget]");

  if (!button) return;

  const category = button.dataset.deleteBudget;

  budgets = budgets.filter(
    (item) => item.category !== category
  );

  saveBudgets();
  renderBudgets();
});

// ========================================
// SEARCH, FILTER AND MONTH
// ========================================

$("reportMonth").addEventListener("change", renderAll);

$("searchInput").addEventListener(
  "input",
  renderTransactions
);

$("filterType").addEventListener(
  "change",
  renderTransactions
);

// ========================================
// LIGHT AND DARK THEME
// ========================================

$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");

  $("themeToggle").textContent = isLight
    ? "☾ Dark mode"
    : "☀ Light mode";

  try {
    localStorage.setItem(
      "financeTheme",
      isLight ? "light" : "dark"
    );
  } catch {
    // Theme still works for this page session.
  }
});

// ========================================
// EXPORT TRANSACTIONS TO CSV
// ========================================

$("exportCsv").addEventListener("click", () => {
  const items = monthTransactions();

  if (!items.length) {
    alert("There are no transactions to export for this month.");
    return;
  }

  const quote = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = [
    ["Date", "Type", "Description", "Category", "Amount"],

    ...items.map((item) => [
      item.date,
      item.type,
      item.description,
      item.category,
      item.amount
    ])
  ];

  const csv = rows
    .map((row) => row.map(quote).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8;" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `financeflow-${selectedMonth()}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});

// ========================================
// DOWNLOAD JSON BACKUP
// ========================================

function exportJSONBackup() {
  const backup = {
    app: "FinanceFlow",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    budgets
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "financeflow-backup.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ========================================
// RESTORE JSON BACKUP
// ========================================

function restoreJSONBackup(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backup = JSON.parse(reader.result);

      if (
        !backup ||
        backup.app !== "FinanceFlow" ||
        backup.formatVersion !== 1 ||
        !Array.isArray(backup.transactions) ||
        !Array.isArray(backup.budgets)
      ) {
        throw new Error("Invalid FinanceFlow backup file.");
      }

      const validTransactions = backup.transactions.every(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.description === "string" &&
          Number.isFinite(Number(item.amount)) &&
          Number(item.amount) > 0 &&
          ["income", "expense"].includes(item.type) &&
          typeof item.category === "string" &&
          typeof item.date === "string"
      );

      const validBudgets = backup.budgets.every(
        (item) =>
          item &&
          typeof item.category === "string" &&
          Number.isFinite(Number(item.amount)) &&
          Number(item.amount) > 0
      );

      if (!validTransactions || !validBudgets) {
        throw new Error("The backup contains invalid data.");
      }

      const confirmed = confirm(
        "This will replace your current transactions and budgets. Continue?"
      );

      if (!confirmed) return;

      localStorage.setItem(
        TRANSACTIONS_KEY,
        JSON.stringify(backup.transactions)
      );

      localStorage.setItem(
        BUDGETS_KEY,
        JSON.stringify(backup.budgets)
      );

      alert("Backup restored successfully! Reloading FinanceFlow.");

      window.location.reload();
    } catch (error) {
      alert("Restore failed: " + error.message);
    } finally {
      event.target.value = "";
    }
  };

  reader.onerror = () => {
    alert("Could not read the selected file.");
    event.target.value = "";
  };

  reader.readAsText(file);
}

// ========================================
// CONNECT JSON BACKUP BUTTONS
// IMPORTANT: DECLARED ONLY ONCE
// ========================================

const exportJsonButton = $("exportJson");
const importJsonButton = $("importJsonButton");
const importJsonInput = $("importJson");

if (exportJsonButton) {
  exportJsonButton.addEventListener(
    "click",
    exportJSONBackup
  );
}

if (importJsonButton && importJsonInput) {
  importJsonButton.addEventListener("click", () => {
    importJsonInput.click();
  });

  importJsonInput.addEventListener(
    "change",
    restoreJSONBackup
  );
}

// ========================================
// LOAD SAVED THEME AND START APP
// ========================================

try {
  if (localStorage.getItem("financeTheme") === "light") {
    document.body.classList.add("light");
    $("themeToggle").textContent = "☾ Dark mode";
  }
} catch {
  // Continue with the default dark theme.
}

// Set current month and date before rendering.
$("reportMonth").value = localDateString().slice(0, 7);
$("date").value = localDateString();

renderAll();