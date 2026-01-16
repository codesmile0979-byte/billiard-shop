// ====== SETTINGS ======
const WHATSAPP_NUMBER_E164 = "994506071700"; // <-- ВПИШИ СВОЙ НОМЕР (без +), пример: 994501112233
const CURRENCY = "$";

// ====== DEMO PRODUCTS (меняй как хочешь) ======
const PRODUCTS = [
  { id: "cue-001", name: "Кий (2-составной) Premium", category: "cue", price: 600, emoji:"🏒", popularity: 90, sku:"AZ-CUE-001", meta:"Вес: 19oz • Материал: клен" },
  { id: "cue-002", name: "Кий Classic", category: "cue", price: 350, emoji:"🏒", popularity: 70, sku:"AZ-CUE-002", meta:"Для новичков • Хороший баланс" },

  { id: "chalk-001", name: "Мел Pro Blue", category: "chalk", price: 18, emoji:"🧊", popularity: 95, sku:"AZ-CH-001", meta:"Сцепление • Меньше кика" },
  { id: "chalk-002", name: "Мел Standard", category: "chalk", price: 8, emoji:"🧊", popularity: 60, sku:"AZ-CH-002", meta:"Базовый вариант" },

  { id: "glove-001", name: "Перчатка Billiard Grip", category: "glove", price: 22, emoji:"🧤", popularity: 88, sku:"AZ-GL-001", meta:"Универсальная • Дышащая" },

  { id: "case-001", name: "Чехол для кия (жёсткий)", category: "case", price: 120, emoji:"🎒", popularity: 80, sku:"AZ-CS-001", meta:"Защита • Отделения под аксессуары" },
  { id: "case-002", name: "Чехол для кия (мягкий)", category: "case", price: 55, emoji:"🎒", popularity: 55, sku:"AZ-CS-002", meta:"Лёгкий • Для ежедневного" },

  { id: "tip-001", name: "Наклейка (tip) Medium", category: "tip", price: 12, emoji:"⚫", popularity: 75, sku:"AZ-TP-001", meta:"Средняя жёсткость" },

  { id: "other-001", name: "Кубик для мела", category: "other", price: 10, emoji:"🧩", popularity: 50, sku:"AZ-OT-001", meta:"Удобно держать" }
];

// ====== STATE ======
const LS_KEY = "billiard_az_cart_v1";
let state = {
  category: "all",
  search: "",
  sort: "popular",
  cart: loadCart()
};

// ====== ELEMENTS ======
const grid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const cartCount = document.getElementById("cartCount");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartSubtitleEl = document.getElementById("cartSubtitle");

const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

const customerName = document.getElementById("customerName");
const customerCity = document.getElementById("customerCity");
const customerAddress = document.getElementById("customerAddress");

const waShown = document.getElementById("waShown");
waShown.textContent = `+${WHATSAPP_NUMBER_E164}`;

// ====== INIT ======
render();

// Filters (chips)
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.category = btn.dataset.category;
    renderProducts();
  });
});

// Search
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value.trim().toLowerCase();
  renderProducts();
});

// Sort
sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderProducts();
});

// Cart drawer open/close
openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// Clear cart
clearCartBtn.addEventListener("click", () => {
  state.cart = {};
  saveCart(state.cart);
  renderCart();
  renderHeader();
});

// Checkout -> WhatsApp
checkoutBtn.addEventListener("click", () => {
  const items = cartToList();
  if (items.length === 0) {
    alert("Корзина пустая.");
    return;
  }

  const name = customerName.value.trim();
  const city = customerCity.value.trim();
  const address = customerAddress.value.trim();

  if (!name || !city) {
    alert("Пожалуйста, заполните Имя и Город.");
    return;
  }

  const message = buildWhatsAppMessage({ name, city, address, items });
  const url = `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

// ====== RENDER ======
function render() {
  renderProducts();
  renderHeader();
  renderCart();
}

function renderHeader() {
  const count = Object.values(state.cart).reduce((sum, x) => sum + x, 0);
  cartCount.textContent = String(count);
}

function renderProducts() {
  const filtered = getFilteredProducts();
  grid.innerHTML = filtered.map(p => productCardHtml(p)).join("");

  // attach events
  filtered.forEach(p => {
    const btn = document.getElementById(`add-${p.id}`);
    btn.addEventListener("click", () => addToCart(p.id, 1));
  });
}

function renderCart() {
  const items = cartToList();

  cartSubtitleEl.textContent = `${items.reduce((s, i) => s + i.qty, 0)} товаров`;

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<div class="small">Корзина пустая. Добавьте товары из каталога.</div>`;
    cartTotalEl.textContent = `${CURRENCY}0`;
    return;
  }

  cartItemsEl.innerHTML = items.map(i => cartItemHtml(i)).join("");
  items.forEach(i => {
    document.getElementById(`minus-${i.id}`).addEventListener("click", () => addToCart(i.id, -1));
    document.getElementById(`plus-${i.id}`).addEventListener("click", () => addToCart(i.id, +1));
    document.getElementById(`remove-${i.id}`).addEventListener("click", () => removeFromCart(i.id));
  });

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  cartTotalEl.textContent = `${CURRENCY}${total}`;
}

function productCardHtml(p) {
  return `
    <article class="card">
      <div class="thumb"><span>${p.emoji}</span></div>
      <div class="card__body">
        <div class="titleRow">
          <div>
            <div class="card__title">${escapeHtml(p.name)}</div>
            <div class="card__meta">${escapeHtml(p.meta || "")}</div>
          </div>
          <div class="sku">${escapeHtml(p.sku)}</div>
        </div>

        <div class="priceRow">
          <div class="price">${CURRENCY}${p.price}</div>
          <div class="small">${categoryLabel(p.category)}</div>
        </div>

        <div class="card__actions">
          <button class="btn btn--primary" id="add-${p.id}">Добавить в корзину</button>
        </div>
      </div>
    </article>
  `;
}

function cartItemHtml(i) {
  return `
    <div class="cartItem">
      <div>
        <div class="cartItem__name">${escapeHtml(i.name)}</div>
        <div class="cartItem__meta">${escapeHtml(i.sku)} • ${CURRENCY}${i.price} / шт</div>
      </div>
      <div class="cartItem__controls">
        <button class="iconBtn" id="minus-${i.id}" aria-label="Минус">−</button>
        <div class="count">${i.qty}</div>
        <button class="iconBtn" id="plus-${i.id}" aria-label="Плюс">+</button>
        <button class="iconBtn" id="remove-${i.id}" aria-label="Удалить">🗑</button>
      </div>
    </div>
  `;
}

// ====== HELPERS ======
function getFilteredProducts() {
  let list = [...PRODUCTS];

  // category
  if (state.category !== "all") {
    list = list.filter(p => p.category === state.category);
  }

  // search
  if (state.search) {
    list = list.filter(p => {
      const hay = `${p.name} ${p.sku} ${p.meta}`.toLowerCase();
      return hay.includes(state.search);
    });
  }

  // sort
  switch (state.sort) {
    case "price_asc":
      list.sort((a,b) => a.price - b.price);
      break;
    case "price_desc":
      list.sort((a,b) => b.price - a.price);
      break;
    case "name_asc":
      list.sort((a,b) => a.name.localeCompare(b.name, "ru"));
      break;
    default:
      list.sort((a,b) => (b.popularity||0) - (a.popularity||0));
  }

  return list;
}

function addToCart(productId, delta) {
  const current = state.cart[productId] || 0;
  const next = current + delta;

  if (next <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = next;
  }
  saveCart(state.cart);
  renderHeader();
  renderCart();
}

function removeFromCart(productId) {
  delete state.cart[productId];
  saveCart(state.cart);
  renderHeader();
  renderCart();
}

function cartToList() {
  const items = [];
  for (const [id, qty] of Object.entries(state.cart)) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) continue;
    items.push({ id: p.id, name: p.name, sku: p.sku, price: p.price, qty });
  }
  // sort in cart by name
  items.sort((a,b) => a.name.localeCompare(b.name, "ru"));
  return items;
}

function buildWhatsAppMessage({ name, city, address, items }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const lines = [];
  lines.push("Здравствуйте! Хочу оформить заказ 🎱");
  lines.push("");
  lines.push(`Имя: ${name}`);
  lines.push(`Город: ${city}`);
  if (address) lines.push(`Адрес: ${address}`);
  lines.push("");
  lines.push("Заказ:");
  items.forEach((i, idx) => {
    lines.push(`${idx+1}) ${i.name} (${i.sku}) — ${i.qty} шт × ${CURRENCY}${i.price} = ${CURRENCY}${i.price*i.qty}`);
  });
  lines.push("");
  lines.push(`Итого: ${CURRENCY}${total}`);
  lines.push("");
  lines.push("Пожалуйста, подтвердите наличие/срок и способ оплаты. Спасибо!");
  return lines.join("\n");
}

function openCart() {
  cartDrawer.classList.remove("hidden");
  cartOverlay.classList.remove("hidden");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.add("hidden");
  cartOverlay.classList.add("hidden");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function saveCart(cart) {
  localStorage.setItem(LS_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function categoryLabel(cat) {
  switch(cat){
    case "cue": return "Кий";
    case "chalk": return "Мел";
    case "glove": return "Перчатка";
    case "case": return "Чехол";
    case "tip": return "Наклейка";
    default: return "Аксессуар";
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
