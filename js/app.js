const state = {
  country: "ALL",
  currency: "RUB",
  query: "",
  sort: "best",
  priority: { minTrust: null, verified: false }
};

const CURRENCY_RATES = { USD: 1, RUB: 92, EUR: 0.92, GBP: 0.79 };
const CURRENCY_SYMBOL = { USD: "$", RUB: "₽", EUR: "€", GBP: "£" };
const COUNTRY_NAMES = { US: "США", RU: "Россия", DE: "Германия", GB: "Великобритания", FR: "Франция", IT: "Италия", ES: "Испания", CA: "Канада", AU: "Австралия" };
const STORE_COLORS = ["#5b6cff", "#8a5bff", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#10b981"];

const grid = document.getElementById("results-grid");
const emptyState = document.getElementById("empty-state");
const emptyText = document.getElementById("empty-text");
const panel = document.getElementById("details-panel");
const overlay = document.getElementById("overlay");
const panelContent = document.getElementById("panel-content");
const resultsTitle = document.getElementById("results-title");
const resultsSub = document.getElementById("results-sub");
const resultsCount = document.getElementById("results-count");

const CATEGORY_COLORS = {
  "наушники": ["#5b6cff", "#8a5bff"],
  "утюг": ["#f59e0b", "#ef4444"],
  "ноутбук": ["#0ea5e9", "#5b6cff"],
  "смартфон": ["#14b8a6", "#0ea5e9"],
  "монитор": ["#8a5bff", "#ec4899"],
  "одежда": ["#10b981", "#14b8a6"],
  "кофеварка": ["#f97316", "#f59e0b"],
  "блендер": ["#ef4444", "#f97316"],
  "телевизор": ["#5b6cff", "#0ea5e9"],
  "пылесос": ["#14b8a6", "#10b981"],
  "смарт-часы": ["#8a5bff", "#5b6cff"],
  "планшет": ["#ec4899", "#8a5bff"],
  "колонка": ["#f59e0b", "#f97316"],
  "чайник": ["#0ea5e9", "#14b8a6"],
  "микроволновка": ["#ef4444", "#f97316"]
};

function catColors(cat) {
  return CATEGORY_COLORS[cat] || ["#5b6cff", "#8a5bff"];
}

function placeholderImage(seed, label) {
  const colors = catColors(label || "");
  const letter = (seed || "?").charAt(0).toUpperCase();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + colors[0] + '"/>' +
    '<stop offset="100%" stop-color="' + colors[1] + '"/></linearGradient></defs>' +
    '<rect width="100%" height="100%" fill="url(#g)"/>' +
    '<circle cx="480" cy="60" r="120" fill="rgba(255,255,255,0.12)"/>' +
    '<circle cx="80" cy="390" r="90" fill="rgba(255,255,255,0.10)"/>' +
    '<text x="50%" y="52%" font-family="Arial, sans-serif" font-size="200" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle" dominant-baseline="middle">' + letter + "</text>" +
    '<text x="50%" y="88%" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.75)" text-anchor="middle">' + label + "</text></svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function imgFallback(img) {
  const letter = (img.alt || "?").charAt(0);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">' +
    '<rect width="100%" height="100%" fill="#e6eaf7"/>' +
    '<text x="50%" y="50%" font-family="Arial" font-size="120" fill="#8a94c0" text-anchor="middle" dominant-baseline="middle">' + letter + "</text></svg>";
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function toUSD(price, currency) {
  const rate = CURRENCY_RATES[currency] || 1;
  return price / rate;
}

function formatPrice(usd) {
  const rate = CURRENCY_RATES[state.currency] || 1;
  const dec = state.currency === "RUB" ? 0 : 2;
  const value = (usd * rate).toLocaleString("ru-RU", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  return value + " " + CURRENCY_SYMBOL[state.currency];
}

function productPrice(p) {
  return formatPrice(toUSD(p.price, p.currency));
}

function oldPrice(p) {
  return p.old > p.price ? formatPrice(toUSD(p.old, p.currency)) : "";
}

function starsHTML(rating) {
  const full = Math.round(rating / 20);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function trustMeta(trust) {
  if (trust >= 85) return { cls: "good", label: "Надёжно" };
  if (trust >= 70) return { cls: "mid", label: "Проверьте магазин" };
  return { cls: "bad", label: "Высокий риск" };
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function storeColor(store) {
  let hash = 0;
  for (let i = 0; i < store.length; i++) hash = (hash * 31 + store.charCodeAt(i)) % 997;
  return STORE_COLORS[hash % STORE_COLORS.length];
}

function passesPriority(p) {
  if (state.priority.minTrust && p.trust < state.priority.minTrust) return false;
  if (state.priority.verified && p.trust < 85) return false;
  return true;
}

function priorityActive() {
  return state.priority.minTrust || state.priority.verified;
}

function priorityHintText() {
  const parts = [];
  if (state.priority.minTrust) parts.push("магазин ≥ " + state.priority.minTrust + "%");
  if (state.priority.verified) parts.push("только проверенные");
  return parts.join(" · ");
}

function updatePriorityUI() {
  document.getElementById("hamburger").classList.toggle("active", priorityActive());
  const hint = document.getElementById("prio-hint");
  if (priorityActive()) {
    hint.hidden = false;
    hint.textContent = "Приоритеты: " + priorityHintText();
  } else {
    hint.hidden = true;
  }
}

function sortProducts(list) {
  const sorted = list.slice();
  switch (state.sort) {
    case "expensive":
      sorted.sort((a, b) => toUSD(b.price, b.currency) - toUSD(a.price, a.currency));
      break;
    case "rating":
      sorted.sort((a, b) => b.trust - a.trust);
      break;
    default:
      sorted.sort((a, b) => toUSD(a.price, a.currency) - toUSD(b.price, b.currency));
  }
  return sorted;
}

let lastProducts = [];

function productCardHTML(p, best) {
  const discount = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const img = p.image || placeholderImage(p.store, p.country ? COUNTRY_NAMES[p.country] : "");
  const t = trustMeta(p.trust);
  return '<article class="card" data-idx="' + lastProducts.indexOf(p) + '">' +
    '<div class="card-img"><img src="' + img + '" alt="' + p.name + '" loading="lazy" onerror="imgFallback(this)"></div>' +
    '<div class="card-body">' +
      '<div class="card-cat">' + p.store + " · " + (p.country ? COUNTRY_NAMES[p.country] : "") + "</div>" +
      '<h3 class="card-name">' + p.name + "</h3>" +
      '<div class="card-price-row">' +
        '<span class="card-price">' + productPrice(p) + "</span>" +
        (discount ? '<span class="card-old">' + oldPrice(p) + "</span>" : "") +
        (discount ? '<span class="offer-discount">−' + discount + "%</span>" : "") +
      "</div>" +
      '<div class="card-meta">' +
        '<span class="trust-pill ' + t.cls + '">' + t.label + " (" + p.trust + "%)</span>" +
        (best ? '<span class="best-badge">Лучшая цена</span>' : "") +
      "</div>" +
    "</div>" +
  "</article>";
}

function renderProducts(list) {
  const visible = list.filter(passesPriority);
  lastProducts = visible;
  const sorted = sortProducts(visible);
  const minPrice = sorted.length ? toUSD(sorted[0].price, sorted[0].currency) : Infinity;
  const best = sorted.length ? sorted[0] : null;

  resultsTitle.textContent = state.query ? "Результаты: «" + state.query + "»" : "Каталог";
  resultsSub.textContent = "Реальные товары из маркетплейсов" +
    (state.country !== "ALL" ? " (" + COUNTRY_NAMES[state.country] + ")" : "") +
    " · цены обновляются в реальном времени";
  resultsCount.textContent = sorted.length + " " + plural(sorted.length, "товар", "товара", "товаров") +
    " · " + new Set(sorted.map(p => p.store)).size + " " + plural(new Set(sorted.map(p => p.store)).size, "магазин", "магазина", "магазинов");

  grid.className = "grid";

  if (!sorted.length) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyText.textContent = priorityActive()
      ? "Под ваши приоритеты ничего не нашлось. Снизьте пороги или сбросьте их в меню приоритетов."
      : "По запросу «" + (state.query || "—") + "» ничего не найдено. Попробуйте изменить запрос или страну.";
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = sorted.map(p => productCardHTML(p, toUSD(p.price, p.currency) === minPrice)).join("");
}

function panelHTML(p) {
  const t = trustMeta(p.trust);
  const discount = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const img = p.image || placeholderImage(p.store, p.country ? COUNTRY_NAMES[p.country] : "");
  const points = [];
  points.push([p.trust >= 85, "Магазин " + (t.label === "Надёжно" ? "проверен и надёжен" : "требует проверки")]);
  points.push([true, "Ссылка ведёт на официальную страницу товара"]);
  points.push([true, "Цена и наличие обновляются в реальном времени"]);
  points.push([!!p.link, "Переход на сайт магазина"]);
  const trustList = points.map(pt =>
    '<li class="' + (pt[0] ? "ok" : "no") + '">' + (pt[0] ? "✓" : "✕") + " " + pt[1] + "</li>"
  ).join("");

  return '<img class="panel-img" src="' + img + '" alt="' + p.name + '" onerror="imgFallback(this)">' +
    '<div class="panel-store">' + p.store + ' <span class="dot">•</span> ' + (p.country ? COUNTRY_NAMES[p.country] : "") + "</div>" +
    '<h2 class="panel-title">' + p.name + "</h2>" +
    '<div class="panel-rating">' + starsHTML(p.trust) + " <span>" + t.label + " · рейтинг магазина " + p.trust + "%</span></div>" +
    '<div class="panel-price-row">' +
      '<span class="panel-price">' + productPrice(p) + "</span>" +
      (discount ? '<span class="panel-old">' + oldPrice(p) + "</span>" : "") +
      (discount ? '<span class="panel-discount">−' + discount + "%</span>" : "") +
    "</div>" +
    '<a class="btn-buy" href="' + (p.link || "#") + '" target="_blank" rel="noopener"' + (p.link ? "" : ' onclick="return false"') + ">" +
    (p.link ? "Перейти в магазин" : "Ссылка недоступна") + "</a>" +
    '<p class="panel-note">' + (p.link
      ? "Откроется страница товара на " + p.store + " в новой вкладке. Цена на сайте магазина может немного отличаться."
      : "Маркетплейс не ответил — попробуйте позже или измените запрос.") + "</p>" +
    '<div class="panel-block">' +
      "<h3>Индекс доверия <span class=\"trust-big " + t.cls + "\">" + p.trust + "%</span></h3>" +
      '<ul class="trust-list">' + trustList + "</ul>" +
    "</div>";
}

function openPanel(p) {
  panelContent.innerHTML = panelHTML(p);
  panel.classList.add("open");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePanel() {
  panel.classList.remove("open");
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function demoProducts() {
  const out = [];
  MODELS.forEach(m => {
    m.offers.forEach(o => {
      out.push({
        name: m.name,
        price: o.price,
        old: o.old || 0,
        image: "",
        link: o.link || "",
        store: o.store,
        storeId: o.store,
        campaign: o.store,
        trust: o.trust,
        currency: (STORE_COUNTRIES[o.store] === "RU") ? "RUB" : "USD",
        country: STORE_COUNTRIES[o.store],
        rating: o.trust,
        reviews: o.reviews
      });
    });
  });
  return out;
}

function filterDemo() {
  let list = demoProducts();
  const q = state.query.trim().toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.store.toLowerCase().includes(q) ||
      String(p.campaign).toLowerCase().includes(q)
    );
  }
  if (state.country !== "ALL") {
    list = list.filter(p => p.country === state.country);
  }
  return list;
}

function renderDemo() {
  const list = filterDemo();
  renderProducts(list);
  resultsSub.textContent = "Демо-данные: маркетплейсы временно недоступны, показан каталог из демо-набора" +
    (state.country !== "ALL" ? " · " + COUNTRY_NAMES[state.country] : "");
  resultsCount.textContent = list.length + " " + plural(list.length, "товар", "товара", "товаров") +
    " (демо)";
}

let loading = false;

async function doSearch() {
  updatePriorityUI();
  if (!state.query.trim()) {
    renderDemo();
    return;
  }
  loading = true;
  resultsTitle.textContent = "Ищем: «" + state.query + "»";
  resultsSub.textContent = "Запрос к маркетплейсам…";
  resultsCount.textContent = "";
  grid.innerHTML = '<div class="loading">Ищем лучшие цены по маркетплейсам…</div>';
  emptyState.hidden = true;
  try {
    const res = await fetch("/api/search?q=" + encodeURIComponent(state.query) + "&country=" + state.country);
    const data = await res.json();
    if (!data.demo && data.products && data.products.length) {
      renderProducts(data.products);
      if (data.warning) {
        resultsSub.textContent = data.warning;
      }
    } else if (data.demo) {
      renderDemo();
    } else {
      renderProducts([]);
      if (data.warning) {
        resultsSub.textContent = data.warning;
      }
    }
  } catch (e) {
    renderDemo();
  }
  loading = false;
}

function render() {
  updatePriorityUI();
  doSearch();
}

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  state.query = document.getElementById("search-input").value.trim();
  render();
  document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    state.query = chip.dataset.q;
    document.getElementById("search-input").value = state.query;
    render();
    document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
  });
});

document.getElementById("country-select").addEventListener("change", function (e) {
  state.country = e.target.value;
  render();
});

document.getElementById("currency-select").addEventListener("change", function (e) {
  state.currency = e.target.value;
  render();
});

document.getElementById("sort-select").addEventListener("change", function (e) {
  state.sort = e.target.value;
  render();
});

const filtersPanel = null;
const settingsPanel = document.getElementById("settings-panel");
const settingsOverlay = document.getElementById("settings-overlay");

document.getElementById("hamburger").addEventListener("click", function () {
  settingsPanel.classList.add("open");
  settingsOverlay.hidden = false;
  document.body.style.overflow = "hidden";
});

function closeSettings() {
  settingsPanel.classList.remove("open");
  settingsOverlay.hidden = true;
  if (!panel.classList.contains("open")) {
    document.body.style.overflow = "";
  }
}

document.getElementById("settings-close").addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", closeSettings);

document.getElementById("prio-trust").addEventListener("change", function (e) {
  state.priority.minTrust = e.target.value === "" ? null : Number(e.target.value);
  render();
});

document.getElementById("prio-verified").addEventListener("change", function (e) {
  state.priority.verified = e.target.checked;
  render();
});

document.getElementById("settings-reset").addEventListener("click", function () {
  state.priority = { minTrust: null, verified: false };
  document.getElementById("prio-trust").value = "";
  document.getElementById("prio-verified").checked = false;
  render();
});

grid.addEventListener("click", function (e) {
  const card = e.target.closest(".card[data-idx]");
  if (card) {
    const p = lastProducts[Number(card.dataset.idx)];
    if (p) openPanel(p);
  }
});

overlay.addEventListener("click", closePanel);
document.getElementById("panel-close").addEventListener("click", closePanel);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closePanel();
    closeSettings();
  }
});

document.getElementById("logo").addEventListener("click", function () {
  state.query = "";
  document.getElementById("search-input").value = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

render();