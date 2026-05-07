/* =====================
   MoneySaver — app.js
   ===================== */

// ──────────────────────────────────────────────
//  State & Storage
// ──────────────────────────────────────────────
const STORAGE_KEY = 'moneysaver_data';

const DEFAULT_DATA = {
  transactions: [],
  settings: {
    theme: 'light',
    currency: '$',
    incomeCategories: ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'],
    expenseCategories: ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
  },
  nextId: 1,
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ──────────────────────────────────────────────
//  DOM Helpers
// ──────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmt(amount) {
  const sym = state.settings.currency;
  return `${sym}${Math.abs(amount).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayISO() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Category emojis
const CATEGORY_ICONS = {
  salary: '💼', freelance: '💻', gift: '🎁', investment: '📈',
  food: '🍔', rent: '🏠', transport: '🚗', utilities: '💡',
  entertainment: '🎬', health: '💊', shopping: '🛍️', other: '📦',
};
function categoryIcon(cat) {
  return CATEGORY_ICONS[cat.toLowerCase()] || '💰';
}

// ──────────────────────────────────────────────
//  Navigation
// ──────────────────────────────────────────────
function navigateTo(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));

  const page = $(`#page-${pageId}`);
  if (page) page.classList.add('active');

  $$('.nav-link').forEach(l => {
    if (l.dataset.page === pageId) l.classList.add('active');
  });

  $('#page-title').textContent = { dashboard: 'Dashboard', transactions: 'Transactions', settings: 'Settings' }[pageId] || pageId;

  if (pageId === 'transactions') renderTransactionPage();
  if (pageId === 'settings') renderSettingsPage();
  if (pageId === 'dashboard') renderDashboard();
}

// ──────────────────────────────────────────────
//  Dashboard
// ──────────────────────────────────────────────
function renderDashboard() {
  const txs = state.transactions;
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  $('#summary-income').textContent = fmt(totalIncome);
  $('#summary-expense').textContent = fmt(totalExpense);
  $('#summary-balance').textContent = fmt(balance);

  // Recent (last 5)
  const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  renderTransactionList('#recent-list', recent);

  drawChart();
}

// ──────────────────────────────────────────────
//  Transactions Page
// ──────────────────────────────────────────────
function renderTransactionPage() {
  const type = $('#filter-type').value;
  const category = $('#filter-category').value;
  const month = $('#filter-month').value; // "YYYY-MM"

  let txs = [...state.transactions];

  if (type !== 'all') txs = txs.filter(t => t.type === type);
  if (category !== 'all') txs = txs.filter(t => t.category === category);
  if (month) txs = txs.filter(t => t.date && t.date.startsWith(month));

  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderTransactionList('#all-transactions-list', txs);

  // Populate category filter
  const cats = [...new Set(state.transactions.map(t => t.category))].sort();
  const sel = $('#filter-category');
  const current = sel.value;
  sel.innerHTML = '<option value="all">All Categories</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    if (c === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderTransactionList(containerSel, txs) {
  const container = $(containerSel);
  if (!txs.length) {
    container.innerHTML = '<div class="empty-state">No transactions found.</div>';
    return;
  }
  container.innerHTML = txs.map(t => `
    <div class="transaction-item" data-id="${t.id}">
      <div class="tx-icon ${t.type}">${categoryIcon(t.category)}</div>
      <div class="tx-info">
        <div class="tx-category">${escHtml(t.category)}</div>
        <div class="tx-desc">${escHtml(t.description || '')}</div>
      </div>
      <div class="tx-date">${formatDate(t.date)}</div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      <div class="tx-actions">
        <button class="btn-icon edit-tx" data-id="${t.id}" title="Edit">✏️</button>
        <button class="btn-icon delete-tx" data-id="${t.id}" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ──────────────────────────────────────────────
//  Chart helpers
// ──────────────────────────────────────────────

/** Draws a rectangle with rounded top corners (cross-browser compatible). */
function drawRoundedBar(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  const radius = Math.min(r, h, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// ──────────────────────────────────────────────
//  Chart (vanilla canvas bar chart)
// ──────────────────────────────────────────────
function drawChart() {
  const canvas = $('#monthly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
  }

  const incomeData = months.map(m => state.transactions.filter(t => t.type === 'income' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));
  const expenseData = months.map(m => state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0));

  const maxVal = Math.max(...incomeData, ...expenseData, 1);
  const padL = 50, padR = 16, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const groupW = chartW / months.length;
  const barW = groupW * 0.35;

  // Style
  const isDark = document.body.className.includes('dark');
  const textColor = isDark ? '#a0aec0' : '#718096';
  const gridColor = isDark ? '#2d3748' : '#e2e8f0';

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  const gridCount = 4;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridCount; i++) {
    const y = padT + (chartH * (gridCount - i) / gridCount);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke();
    const label = fmt((maxVal * i) / gridCount);
    ctx.fillStyle = textColor; ctx.font = `11px sans-serif`; ctx.textAlign = 'right';
    ctx.fillText(label, padL - 4, y + 4);
  }

  months.forEach((m, i) => {
    const x = padL + i * groupW + groupW / 2;
    const iH = (incomeData[i] / maxVal) * chartH;
    const eH = (expenseData[i] / maxVal) * chartH;

    // Income bar
    ctx.fillStyle = '#38a169';
    drawRoundedBar(ctx, x - barW - 2, padT + chartH - iH, barW, iH, 3);

    // Expense bar
    ctx.fillStyle = '#e53e3e';
    drawRoundedBar(ctx, x + 2, padT + chartH - eH, barW, eH, 3);

    // Month label
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x, padT + chartH + 20);
  });

  // Legend
  const lx = padL;
  const ly = padT + chartH + 34;
  ctx.fillStyle = '#38a169';
  ctx.fillRect(lx, ly - 8, 12, 8);
  ctx.fillStyle = textColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Income', lx + 16, ly);
  ctx.fillStyle = '#e53e3e';
  ctx.fillRect(lx + 72, ly - 8, 12, 8);
  ctx.fillStyle = textColor;
  ctx.fillText('Expense', lx + 88, ly);
}

// ──────────────────────────────────────────────
//  Settings Page
// ──────────────────────────────────────────────
function renderSettingsPage() {
  $('#theme-select').value = state.settings.theme;
  $('#currency-select').value = state.settings.currency;
  renderCategoryList('income');
  renderCategoryList('expense');
}

function renderCategoryList(type) {
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  const container = $(`#${type}-categories-list`);
  const cats = state.settings[key];
  container.innerHTML = cats.map(c => `
    <div class="category-tag">
      <span>${escHtml(c)}</span>
      <button class="remove-category" data-type="${type}" data-cat="${escHtml(c)}" title="Remove">✕</button>
    </div>
  `).join('');
}

// ──────────────────────────────────────────────
//  Transaction Modal
// ──────────────────────────────────────────────
let editingId = null;
let pendingConfirmCallback = null;

function openConfirm(title, message, onConfirm) {
  $('#confirm-title').textContent = title;
  $('#confirm-message').textContent = message;
  pendingConfirmCallback = onConfirm;
  openModal('confirm-overlay');
}

function openAddModal(prefillType = 'income') {
  editingId = null;
  $('#modal-title').textContent = 'Add Transaction';
  $('#modal-submit').textContent = 'Add';
  $('#form-type').value = prefillType;
  $('#form-amount').value = '';
  $('#form-description').value = '';
  $('#form-date').value = todayISO();
  setFormType(prefillType);
  populateCategorySelect(prefillType);
  openModal('modal-overlay');
}

function openEditModal(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  editingId = id;
  $('#modal-title').textContent = 'Edit Transaction';
  $('#modal-submit').textContent = 'Save';
  $('#form-type').value = tx.type;
  $('#form-amount').value = tx.amount;
  $('#form-description').value = tx.description || '';
  $('#form-date').value = tx.date;
  setFormType(tx.type);
  populateCategorySelect(tx.type, tx.category);
  openModal('modal-overlay');
}

function setFormType(type) {
  $$('.toggle-btn').forEach(b => b.classList.remove('active'));
  $(`#type-${type}`).classList.add('active');
  $('#form-type').value = type;
}

function populateCategorySelect(type, selected) {
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  const cats = state.settings[key];
  const sel = $('#form-category');
  sel.innerHTML = cats.map(c => `<option value="${escHtml(c)}"${c === selected ? ' selected' : ''}>${escHtml(c)}</option>`).join('');
}

function openModal(id) { $(`#${id}`).classList.add('open'); }
function closeModal(id) { $(`#${id}`).classList.remove('open'); }

// ──────────────────────────────────────────────
//  CRUD
// ──────────────────────────────────────────────
function addTransaction(data) {
  state.transactions.push({ id: state.nextId++, ...data });
  saveState();
  refresh();
}

function updateTransaction(id, data) {
  const idx = state.transactions.findIndex(t => t.id === id);
  if (idx === -1) return;
  state.transactions[idx] = { id, ...data };
  saveState();
  refresh();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState();
  refresh();
}

function refresh() {
  const activePage = $$('.page.active')[0];
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'transactions') renderTransactionPage();
}

// ──────────────────────────────────────────────
//  Export CSV
// ──────────────────────────────────────────────
function exportCSV() {
  const header = 'Date,Type,Category,Description,Amount';
  const rows = state.transactions.map(t =>
    [t.date, t.type, `"${t.category}"`, `"${(t.description || '').replace(/"/g, '""')}"`, t.amount].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moneysaver_export_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
//  Event Listeners
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  applyTheme(state.settings.theme);

  // Initial render
  renderDashboard();

  // Sidebar navigation
  document.addEventListener('click', e => {
    const navLink = e.target.closest('.nav-link');
    if (navLink) {
      e.preventDefault();
      navigateTo(navLink.dataset.page);
    }
  });

  // Sidebar toggle
  $('#toggle-sidebar').addEventListener('click', () => {
    $('#sidebar').classList.toggle('collapsed');
  });
  $('#open-sidebar').addEventListener('click', () => {
    $('#sidebar').classList.toggle('collapsed');
  });

  // Add Transaction button
  $('#add-transaction-btn').addEventListener('click', () => openAddModal());

  // Type toggle in modal
  $$('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.value;
      setFormType(type);
      populateCategorySelect(type);
    });
  });

  // Modal close
  $('#modal-close').addEventListener('click', () => closeModal('modal-overlay'));
  $('#modal-cancel').addEventListener('click', () => closeModal('modal-overlay'));
  $('#modal-overlay').addEventListener('click', e => { if (e.target === $('#modal-overlay')) closeModal('modal-overlay'); });

  // Transaction form submit
  $('#transaction-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      type: $('#form-type').value,
      amount: parseFloat($('#form-amount').value),
      category: $('#form-category').value,
      description: $('#form-description').value.trim(),
      date: $('#form-date').value,
    };
    if (editingId !== null) {
      updateTransaction(editingId, data);
    } else {
      addTransaction(data);
    }
    closeModal('modal-overlay');
  });

  // Transaction list interactions (edit / delete)
  document.addEventListener('click', e => {
    const editBtn = e.target.closest('.edit-tx');
    if (editBtn) { openEditModal(parseInt(editBtn.dataset.id, 10)); return; }

    const deleteBtn = e.target.closest('.delete-tx');
    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id, 10);
      openConfirm('Delete Transaction', 'Are you sure you want to delete this transaction?', () => {
        deleteTransaction(id);
      });
    }
  });

  // Confirm modal shared handlers
  $('#confirm-close').addEventListener('click', () => closeModal('confirm-overlay'));
  $('#confirm-cancel').addEventListener('click', () => closeModal('confirm-overlay'));
  $('#confirm-overlay').addEventListener('click', e => { if (e.target === $('#confirm-overlay')) closeModal('confirm-overlay'); });
  $('#confirm-ok').addEventListener('click', () => {
    if (typeof pendingConfirmCallback === 'function') pendingConfirmCallback();
    pendingConfirmCallback = null;
    closeModal('confirm-overlay');
  });

  // Filters on transactions page
  ['filter-type', 'filter-category', 'filter-month'].forEach(id => {
    $(`#${id}`).addEventListener('change', renderTransactionPage);
  });

  // Settings — theme
  $('#theme-select').addEventListener('change', () => {
    const theme = $('#theme-select').value;
    state.settings.theme = theme;
    applyTheme(theme);
    saveState();
  });

  // Settings — currency
  $('#currency-select').addEventListener('change', () => {
    state.settings.currency = $('#currency-select').value;
    saveState();
    refresh();
  });

  // Settings — add category
  $('#add-income-category-btn').addEventListener('click', () => addCategory('income'));
  $('#add-expense-category-btn').addEventListener('click', () => addCategory('expense'));

  // Settings — remove category
  document.addEventListener('click', e => {
    const removeBtn = e.target.closest('.remove-category');
    if (!removeBtn) return;
    const type = removeBtn.dataset.type;
    const cat = removeBtn.dataset.cat;
    const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
    state.settings[key] = state.settings[key].filter(c => c !== cat);
    saveState();
    renderCategoryList(type);
  });

  // Settings — export
  $('#export-btn').addEventListener('click', exportCSV);

  // Settings — clear data
  $('#clear-data-btn').addEventListener('click', () => {
    openConfirm('Clear All Data', 'This will permanently delete all transactions. Are you sure?', () => {
      state.transactions = [];
      state.nextId = 1;
      saveState();
      refresh();
    });
  });

  // Redraw chart on resize
  window.addEventListener('resize', () => {
    if ($('#page-dashboard').classList.contains('active')) drawChart();
  });
});

function applyTheme(theme) {
  document.body.className = `theme-${theme}`;
}

function addCategory(type) {
  const inputId = `new-${type}-category`;
  const input = $(`#${inputId}`);
  const val = input.value.trim();
  if (!val) return;
  const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
  if (!state.settings[key].includes(val)) {
    state.settings[key].push(val);
    saveState();
  }
  input.value = '';
  renderCategoryList(type);
}
