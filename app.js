/* ============================================================
   Tally — interactive UI prototype
   ============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const money  = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const money2 = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const marginOf = (price, cost) => (price > 0 ? Math.round(((price - cost) / price) * 100) : 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const ART = k => `<svg class="art" viewBox="0 0 120 120" aria-hidden="true"><use href="#art-${k}"></use></svg>`;

const state = {
  revenue: 18240,
  spent: 5760,
  current: 'mug',
  filter: 'All',
  expFilter: 'All',
  orders: 442,
  items: [
    { id:'mug',  name:'Ceramic Mug',    cat:'Homeware',    price:24,  cost:9,   stock:12, sold:46, art:'mug',      date:'12 Oct' },
    { id:'cam',  name:'Film Camera',    cat:'Electronics', price:180, cost:110, stock:3,  sold:7,  art:'camera',   date:'9 Oct'  },
    { id:'tote', name:'Linen Tote',     cat:'Accessories', price:38,  cost:14,  stock:24, sold:31, art:'tote',     date:'6 Oct'  },
    { id:'lamp', name:'Desk Lamp',      cat:'Homeware',    price:95,  cost:52,  stock:2,  sold:9,  art:'lamp',     date:'3 Oct'  },
    { id:'bowl', name:'Stoneware Bowl', cat:'Homeware',    price:32,  cost:11,  stock:8,  sold:22, art:'bowl',     date:'28 Sep' },
    { id:'book', name:'Linen Notebook', cat:'Stationery',  price:18,  cost:5,   stock:31, sold:54, art:'notebook', date:'21 Sep' }
  ],
  expenseList: [
    { name:'Utilities',        cat:'Utilities', amount:486,  date:'22 Oct' },
    { name:'Payment fees',     cat:'Fees',      amount:318,  date:'18 Oct' },
    { name:'Shipping & courier', cat:'Shipping', amount:420, date:'11 Oct' },
    { name:'Packaging',        cat:'Supplies',  amount:456,  date:'8 Oct'  },
    { name:'Clay & glaze',     cat:'Supplies',  amount:1680, date:'4 Oct'  },
    { name:'Studio rent',      cat:'Rent',      amount:2400, date:'1 Oct'  }
  ]
};

const TAB = { home:'home', scan:'scan', inventory:'inventory', item:'inventory', insights:'insights', expenses:'expenses' };
const EXP_ICON = { Supplies:'box', Rent:'home', Shipping:'truck', Fees:'card', Utilities:'bolt' };

let scanCat = 'Homeware';
let priceStr = '24.00';
let expStr = '';
let exCat = 'Supplies';

/* ---------------- totals & money ---------------- */
function item() {
  return state.items.find(i => i.id === state.current) || state.items[0];
}

function updateTotals() {
  const profit = Math.max(0, state.revenue - state.spent);
  const invValue = state.items.reduce((sum, i) => sum + i.price * i.stock, 0);
  const map = { profit, revenue: state.revenue, expenses: state.spent };
  $$('[data-bind]').forEach(el => { el.textContent = money(map[el.dataset.bind]); });
  $$('[data-bind-inv]').forEach(el => { el.textContent = money(invValue); });
  $('#inv-count').textContent = state.items.length + ' items';
  $('#exp-entries').textContent = state.expenseList.length + ' entries';
}

/* ---------------- renderers ---------------- */
function renderLowStock() {
  const low = state.items.filter(i => i.stock <= 5).slice(0, 4);
  $('#lowstock').innerHTML = low.length
    ? low.map(i => `
      <button class="low-card" data-item="${i.id}">
        <span class="low-thumb">${ART(i.art)}</span>
        <span class="low-name">${esc(i.name)}</span>
        <span class="low-meta"><b>${i.stock} left</b> · ${money2(i.price)}</span>
      </button>`).join('')
    : `<button class="low-empty" data-go="inventory">Everything is well stocked — nice.</button>`;
}

function renderInventory() {
  const q = ($('#search').value || '').trim().toLowerCase();
  let list = state.items.filter(i => {
    if (state.filter === 'Low stock') return i.stock <= 5;
    if (state.filter !== 'All') return i.cat === state.filter;
    return true;
  });
  if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || i.cat.toLowerCase().includes(q));

  $('#inv-list').innerHTML = list.length ? list.map(i => `
    <button class="item-row" data-item="${i.id}">
      <span class="thumb">${ART(i.art)}</span>
      <span class="item-main">
        <span class="item-name">${esc(i.name)}</span>
        <span class="item-meta">${i.stock} in stock · ${esc(i.cat)}</span>
      </span>
      <span class="item-right">
        <span class="item-price">${money2(i.price)}</span>
        <span class="item-sub ${i.stock <= 5 ? 'low' : ''}">${i.stock <= 5 ? 'Low · ' + i.stock + ' left' : marginOf(i.price, i.cost) + '% margin'}</span>
      </span>
    </button>`).join('')
    : `<p class="empty">No items match that search.</p>`;
}

function renderDetail() {
  const i = item();
  state.current = i.id;
  $('#d-art').innerHTML = ART(i.art) + `<span class="detail-badge">${esc(i.cat)}</span>`;
  $('#d-cat').textContent = i.cat;
  $('#d-name').textContent = i.name;
  $('#d-price').textContent = money2(i.price);
  $('#d-margin').textContent = marginOf(i.price, i.cost) + '% margin';
  $('#d-stock').textContent = i.stock;
  $('#d-sold').textContent = i.sold;
  $('#d-rev').textContent = money2(i.price * i.sold);
  $('#d-cost').textContent = money2(i.cost);
  $('#d-date').textContent = 'Last edited ' + i.date;
}

function renderExpenses() {
  const list = state.expenseList.filter(x => state.expFilter === 'All' || x.cat === state.expFilter);
  $('#exp-list').innerHTML = list.length ? list.map(x => `
    <div class="exp-row">
      <span class="exp-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${EXP_ICON[x.cat] || 'receipt'}"></use></svg></span>
      <span class="exp-main"><b>${esc(x.name)}</b><span>${esc(x.cat)} · ${esc(x.date)}</span></span>
      <span class="exp-amt">− ${money2(x.amount)}</span>
    </div>`).join('')
    : `<p class="empty">No expenses in this category yet.</p>`;
  $('#exp-entries').textContent = state.expenseList.length + ' entries';
}

const CHART_DATA = {
  Week:  { labels:['M','T','W','T','F','S','S'],                      rev:[340,420,280,610,860,1240,510],    exp:[140,180,110,260,320,390,180] },
  Month: { labels:['W1','W2','W3','W4','W5','W6'],                     rev:[2400,2860,2650,3240,3380,3710],   exp:[720,660,880,940,1080,1480] },
  Year:  { labels:['Jan','Mar','May','Jul','Sep','Nov'],               rev:[21400,24800,23600,27600,29200,32200], exp:[7400,8100,6900,9200,8800,10300] }
};

function renderChart(period) {
  const d = CHART_DATA[period];
  const totalRev = d.rev.reduce((a, b) => a + b, 0);
  const totalExp = d.exp.reduce((a, b) => a + b, 0);
  const max = Math.max(...d.rev, ...d.exp);
  const pct = Math.round(((totalRev - totalExp) / totalRev) * 100);

  $('#chart').innerHTML = d.labels.map((l, idx) => `
    <div class="bargroup">
      <div class="pair">
        <i class="bar rev" style="height:${(d.rev[idx] / max * 100).toFixed(1)}%;animation-delay:${idx * 28}ms"></i>
        <i class="bar exp" style="height:${(d.exp[idx] / max * 100).toFixed(1)}%;animation-delay:${idx * 28 + 60}ms"></i>
      </div>
      <span>${l}</span>
    </div>`).join('');

  $('#ins-rev').textContent = money(totalRev);
  $('#ins-exp').textContent = money(totalExp);
  $('#ins-net').textContent = pct + '% net';
  $('#donut').style.background = `conic-gradient(var(--ink) 0 ${pct}%, var(--sage-3) ${pct}% 100%)`;
  $('#donut-val').textContent = pct + '%';
  $('#donut-note').textContent = period === 'Month' ? '+2.1 pts vs September' : 'Net margin · ' + period.toLowerCase();
}

function renderTopSellers() {
  const top = [...state.items].sort((a, b) => b.sold - a.sold).slice(0, 3);
  const max = top[0] ? top[0].sold : 1;
  $('#top-sellers').innerHTML = top.map((i, idx) => `
    <div class="seller">
      <span class="thumb">${ART(i.art)}</span>
      <span class="seller-main">
        <span class="seller-top">
          <span class="seller-name">${esc(i.name)}</span>
          <span class="seller-amt">${money2(i.price * i.sold)}</span>
        </span>
        <span class="progress"><i style="width:${(i.sold / max * 100).toFixed(0)}%"></i></span>
        <span class="seller-meta">${i.sold} sold · ${marginOf(i.price, i.cost)}% margin</span>
      </span>
    </div>`).join('');
}

/* ---------------- navigation ---------------- */
function go(id) {
  const el = document.getElementById('s-' + id);
  if (!el) return;
  if (id === 'item') renderDetail();
  $$('.screen').forEach(s => s.classList.toggle('active', s === el));
  el.scrollTop = 0;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.go === TAB[id]));
  $$('.rail-nav button').forEach(b => b.classList.toggle('active', b.dataset.go === id));
  $('#statusbar').classList.toggle('light', id === 'scan');
  $('#tabbar').classList.toggle('dark', id === 'scan');
  closeSheets();
}

function selectItem(id) {
  state.current = id;
  renderDetail();
  go('item');
}

/* ---------------- sheets ---------------- */
function openSheet(name) {
  closeSheets();
  const el = document.getElementById('sheet-' + name);
  if (!el) return;

  if (name === 'scan') {
    $('#scan-name').value = 'Ceramic Mug';
    $('#scan-price').value = '24.00';
    $('#scan-margin').textContent = marginOf(24, 9) + '% margin';
    scanCat = 'Homeware';
    $$('#scan-cats .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'Homeware'));
  }
  if (name === 'price') {
    const i = item();
    priceStr = i.price.toFixed(2);
    $('#ep-cat').textContent = i.cat;
    $('#ep-name').textContent = i.name;
    $('#ep-cost').textContent = money2(i.cost);
    paintPrice();
  }
  if (name === 'expense') {
    expStr = '';
    exCat = 'Supplies';
    $('#ex-note').value = '';
    $$('#ex-cats .chip').forEach(c => c.classList.toggle('active', c.dataset.excat === 'Supplies'));
    paintExpense();
  }

  el.classList.add('open');
  $('#backdrop').classList.add('show');
}

function closeSheets() {
  $$('.sheet.open').forEach(s => s.classList.remove('open'));
  $('#backdrop').classList.remove('show');
}

function keyPress(str, key) {
  if (key === 'del') return str.slice(0, -1);
  if (key === '.') {
    if (str.includes('.')) return str;
    return str === '' ? '0.' : str + '.';
  }
  if (str.includes('.')) {
    if (str.split('.')[1].length >= 2) return str;
  } else if (str.length >= 5) {
    return str;
  }
  if (str === '0') return key;
  return str + key;
}

function paintPrice() {
  const i = item();
  const val = parseFloat(priceStr) || 0;
  $('#ep-value').textContent = priceStr === '' ? '0' : priceStr;
  $('#ep-margin').textContent = 'Margin ' + marginOf(val, i.cost) + '%';
}

function paintExpense() {
  $('#ex-value').textContent = expStr === '' ? '0' : expStr;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2100);
}

let scanBusy = false;

/* ---------------- global clicks ---------------- */
document.addEventListener('click', e => {
  const t = e.target;

  if (t.closest('#backdrop') || t.closest('[data-close]')) { closeSheets(); return; }

  const goEl = t.closest('[data-go]');
  if (goEl) { go(goEl.dataset.go); return; }

  const sheetEl = t.closest('[data-sheet]');
  if (sheetEl) { openSheet(sheetEl.dataset.sheet); return; }

  const toastEl = t.closest('[data-toast]');
  if (toastEl) { toast(toastEl.dataset.toast); return; }

  const itemEl = t.closest('[data-item]');
  if (itemEl) { selectItem(itemEl.dataset.item); return; }

  const filt = t.closest('[data-filter]');
  if (filt) {
    state.filter = filt.dataset.filter;
    $$('#inv-filters .chip').forEach(c => c.classList.toggle('active', c === filt));
    renderInventory();
    return;
  }

  const expFilt = t.closest('[data-expfilter]');
  if (expFilt) {
    state.expFilter = expFilt.dataset.expfilter;
    $$('#exp-filters .chip').forEach(c => c.classList.toggle('active', c === expFilt));
    renderExpenses();
    return;
  }

  const period = t.closest('[data-period]');
  if (period) {
    $$('#period button').forEach(b => b.classList.toggle('active', b === period));
    renderChart(period.dataset.period);
    return;
  }

  const cat = t.closest('#scan-cats [data-cat]');
  if (cat) {
    scanCat = cat.dataset.cat;
    $$('#scan-cats .chip').forEach(c => c.classList.toggle('active', c === cat));
    return;
  }

  const exCatEl = t.closest('#ex-cats [data-excat]');
  if (exCatEl) {
    exCat = exCatEl.dataset.excat;
    $$('#ex-cats .chip').forEach(c => c.classList.toggle('active', c === exCatEl));
    return;
  }

  const key = t.closest('.key');
  if (key) {
    const pad = key.closest('[data-keypad]').dataset.keypad;
    if (pad === 'price') { priceStr = keyPress(priceStr, key.dataset.key); paintPrice(); }
    else { expStr = keyPress(expStr, key.dataset.key); paintExpense(); }
    return;
  }

  const step = t.closest('[data-step]');
  if (step) {
    const i = item();
    i.stock = Math.max(0, i.stock + Number(step.dataset.step));
    renderDetail(); renderInventory(); renderLowStock(); updateTotals();
    return;
  }
});

/* ---------------- actions ---------------- */
$('#search').addEventListener('input', renderInventory);

$('#scan-price').addEventListener('input', e => {
  const price = Math.max(0, parseFloat(e.target.value) || 0);
  $('#scan-margin').textContent = marginOf(price, 9) + '% margin';
});

$('#shutter').addEventListener('click', () => {
  if (scanBusy) return;
  scanBusy = true;
  const cam = $('#scan-cam');
  cam.classList.add('scanning');
  $('#shutter').classList.add('busy');
  setTimeout(() => cam.classList.add('captured'), 260);
  setTimeout(() => {
    cam.classList.remove('captured');
    cam.classList.add('detected');
  }, 720);
  setTimeout(() => {
    openSheet('scan');
    cam.classList.remove('scanning', 'detected');
    $('#shutter').classList.remove('busy');
    scanBusy = false;
  }, 1550);
});

$('#save-scan').addEventListener('click', () => {
  const name = $('#scan-name').value.trim() || 'Untitled item';
  const price = Math.max(0, parseFloat($('#scan-price').value) || 0);
  const it = {
    id: 'n' + Date.now(), name, cat: scanCat, price,
    cost: 9, stock: 1, sold: 0, art: 'mug', date: 'Today'
  };
  state.items.unshift(it);
  state.current = it.id;
  renderInventory(); renderLowStock(); updateTotals();
  closeSheets();
  go('inventory');
  toast(name + ' added · ' + money2(price));
});

$('#save-price').addEventListener('click', () => {
  const val = parseFloat(priceStr);
  if (!(val > 0)) { toast('Enter a valid price'); return; }
  const i = item();
  i.price = Math.round(val * 100) / 100;
  i.date = 'Today';
  renderDetail(); renderInventory(); renderLowStock(); updateTotals();
  closeSheets();
  toast('Price updated to ' + money2(i.price));
});

$('#save-expense').addEventListener('click', () => {
  const amt = parseFloat(expStr);
  if (!(amt > 0)) { toast('Enter an amount'); return; }
  const note = $('#ex-note').value.trim();
  state.spent += amt;
  state.expenseList.unshift({
    name: note || (exCat + ' expense'),
    cat: exCat, amount: amt, date: 'Today'
  });
  state.expFilter = 'All';
  $$('#exp-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.expfilter === 'All'));
  updateTotals(); renderExpenses();
  closeSheets();
  toast('Expense added · ' + money2(amt));
});

$('#sell-btn').addEventListener('click', () => {
  const i = item();
  if (i.stock <= 0) { toast('Out of stock — restock first'); return; }
  i.stock -= 1;
  i.sold += 1;
  state.revenue += i.price;
  state.orders += 1;
  updateTotals(); renderDetail(); renderInventory(); renderLowStock(); renderTopSellers();
  toast('Sale recorded · ' + money2(i.price));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSheets();
});

/* ---------------- fit the device ---------------- */
function fit() {
  const s = Math.min(1, (window.innerHeight - 40) / 872, (window.innerWidth - 32) / 413);
  document.documentElement.style.setProperty('--s', Math.max(.55, s).toFixed(3));
}
window.addEventListener('resize', fit);

/* ---------------- boot ---------------- */
fit();
renderLowStock();
renderInventory();
renderDetail();
renderExpenses();
renderChart('Month');
renderTopSellers();
updateTotals();

/* deep links for design review: ?s=scan&item=cam&sheet=price */
const params = new URLSearchParams(location.search);
if (params.get('item')) { state.current = params.get('item'); renderDetail(); }
if (params.get('s')) { go(params.get('s')); }
if (params.get('sheet')) { openSheet(params.get('sheet')); }

