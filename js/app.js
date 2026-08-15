const state = {
  country: "ALL",
  currency: "RUB",
  query: "",
  sort: "best",
  modelId: null,
  filters: {},
  priority: { minRating: null, minSeller: null, minTrust: null, minReviews: null, verified: false }
};

const FILTER_DEFS = {
  "наушники": [{ id: "brand", label: "Бренд" }, { id: "type", label: "Тип" }, { id: "anc", label: "Шумоподавление" }, { id: "bt", label: "Bluetooth" }, { id: "battery", label: "Автономность" }],
  "утюг": [{ id: "brand", label: "Бренд" }, { id: "power", label: "Мощность" }, { id: "steam", label: "Паровой удар" }, { id: "tank", label: "Резервуар" }],
  "ноутбук": [{ id: "brand", label: "Бренд" }, { id: "cpu", label: "Процессор" }, { id: "gpu", label: "Видеокарта" }, { id: "screen", label: "Экран" }, { id: "ram", label: "Память" }, { id: "weight", label: "Вес" }],
  "смартфон": [{ id: "brand", label: "Бренд" }, { id: "memory", label: "Память" }, { id: "screen", label: "Экран" }, { id: "camera", label: "Камера" }, { id: "battery", label: "Батарея" }],
  "монитор": [{ id: "brand", label: "Бренд" }, { id: "size", label: "Диагональ" }, { id: "hz", label: "Частота" }, { id: "matrix", label: "Матрица" }, { id: "res", label: "Разрешение" }],
  "одежда": [{ id: "brand", label: "Бренд" }, { id: "type", label: "Тип" }, { id: "size", label: "Размер" }, { id: "color", label: "Цвет" }, { id: "material", label: "Материал" }],
  "кофеварка": [{ id: "brand", label: "Бренд" }, { id: "type", label: "Тип" }, { id: "tank", label: "Объём" }],
  "блендер": [{ id: "brand", label: "Бренд" }, { id: "type", label: "Тип" }, { id: "powerW", label: "Мощность" }],
  "телевизор": [{ id: "brand", label: "Бренд" }, { id: "size", label: "Диагональ" }, { id: "res", label: "Разрешение" }, { id: "matrix", label: "Матрица" }],
  "пылесос": [{ id: "brand", label: "Бренд" }, { id: "type", label: "Тип" }, { id: "powerW", label: "Мощность" }],
  "смарт-часы": [{ id: "brand", label: "Бренд" }, { id: "battery", label: "Батарея" }, { id: "screen", label: "Экран" }],
  "планшет": [{ id: "brand", label: "Бренд" }, { id: "screen", label: "Экран" }, { id: "memory", label: "Память" }],
  "колонка": [{ id: "brand", label: "Бренд" }, { id: "powerW", label: "Мощность" }, { id: "bt", label: "Bluetooth" }],
  "чайник": [{ id: "brand", label: "Бренд" }, { id: "tank", label: "Объём" }],
  "микроволновка": [{ id: "brand", label: "Бренд" }, { id: "tank", label: "Объём" }, { id: "powerW", label: "Мощность" }]
};

const MODEL_ATTRS = {
  m1: { brand: "Realme", type: "TWS", anc: "есть", bt: "5.3", battery: "40 ч" },
  m2: { brand: "Sony", type: "накладные", anc: "есть", bt: "5.2", battery: "50 ч" },
  m3: { brand: "JBL", type: "накладные", anc: "нет", bt: "5.3", battery: "40 ч" },
  m4: { brand: "Xiaomi", type: "TWS", anc: "есть", bt: "5.3", battery: "40 ч" },
  m5: { brand: "Bosch", power: "2400 Вт", steam: "120 г/мин", tank: "0.35 л" },
  m6: { brand: "Philips", power: "2400 Вт", steam: "120 г/мин", tank: "0.3 л" },
  m7: { brand: "Tefal", power: "2800 Вт", steam: "220 г/мин", tank: "0.3 л" },
  m8: { brand: "Braun", power: "2400 Вт", steam: "215 г/мин", tank: "0.35 л" },
  m9: { brand: "Lenovo", cpu: "Ryzen 5", gpu: "встроенная Radeon", screen: '15.6"', ram: "16 ГБ", weight: "1.6 кг" },
  m10: { brand: "Acer", cpu: "Core i5", gpu: "встроенная Iris", screen: '15.6"', ram: "16 ГБ", weight: "1.8 кг" },
  m11: { brand: "HP", cpu: "Core i3", gpu: "встроенная UHD", screen: '15.6"', ram: "8 ГБ", weight: "1.7 кг" },
  m12: { brand: "Xiaomi", memory: "128 ГБ", screen: '6.74"', camera: "50 Мп", battery: "5000 мАч" },
  m13: { brand: "Samsung", memory: "128 ГБ", screen: '6.5"', camera: "50 Мп", battery: "5000 мАч" },
  m14: { brand: "DeLonghi", type: "эспрессо-машина", tank: "1 л" },
  m15: { brand: "Bosch", type: "капельная", tank: "1.25 л" },
  m16: { brand: "Philips", type: "погружной", powerW: "700 Вт" },
  m17: { brand: "Bosch", type: "стационарный", powerW: "600 Вт" },
  m25: { brand: "Samsung", size: "55\"", res: "4K", matrix: "VA" },
  m26: { brand: "LG", size: "55\"", res: "4K", matrix: "OLED" },
  m27: { brand: "TCL", size: "50\"", res: "4K", matrix: "QLED" },
  m28: { brand: "Dyson", type: "вертикальный", powerW: "150 Вт" },
  m29: { brand: "Xiaomi", type: "робот-пылесос", powerW: "55 Вт" },
  m30: { brand: "Bosch", type: "цилиндрический", powerW: "700 Вт" },
  m31: { brand: "Apple", screen: '1.9"', battery: "18 ч" },
  m32: { brand: "Samsung", screen: '1.5"', battery: "40 ч" },
  m33: { brand: "Xiaomi", screen: '1.43"', battery: "15 дней" },
  m34: { brand: "Apple", screen: '10.9"', memory: "64 ГБ" },
  m35: { brand: "Samsung", screen: '10.9"', memory: "128 ГБ" },
  m36: { brand: "JBL", powerW: "20 Вт", bt: "5.1" },
  m37: { brand: "Xiaomi", powerW: "30 Вт", bt: "5.0" },
  m38: { brand: "Bosch", tank: "1.7 л" },
  m39: { brand: "Polaris", tank: "1.8 л" },
  m40: { brand: "Samsung", tank: "23 л", powerW: "800 Вт" },
  m41: { brand: "LG", tank: "20 л", powerW: "700 Вт" }
};

const CURRENCY_RATES = { USD: 1, RUB: 92, EUR: 0.92, GBP: 0.79 };
const CURRENCY_SYMBOL = { USD: "$", RUB: "₽", EUR: "€", GBP: "£" };
const COUNTRY_NAMES = { US: "США", RU: "Россия", DE: "Германия", GB: "Великобритания" };
const STORE_COLORS = ["#5b6cff", "#8a5bff", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#10b981"];

const grid = document.getElementById("results-grid");
const emptyState = document.getElementById("empty-state");
const emptyText = document.getElementById("empty-text");
const panel = document.getElementById("details-panel");
const overlay = document.getElementById("overlay");
const panelContent = document.getElementById("panel-content");
const backBtn = document.getElementById("back-btn");
const resultsTitle = document.getElementById("results-title");
const resultsSub = document.getElementById("results-sub");
const resultsCount = document.getElementById("results-count");

function formatPrice(usd) {
  const rate = CURRENCY_RATES[state.currency] || 1;
  const dec = state.currency === "RUB" ? 0 : 2;
  const value = (usd * rate).toLocaleString("ru-RU", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
  return value + " " + CURRENCY_SYMBOL[state.currency];
}

function starsHTML(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function trustMeta(trust) {
  if (trust >= 85) return { cls: "good", label: "Надёжно" };
  if (trust >= 70) return { cls: "mid", label: "Проверьте продавца" };
  return { cls: "bad", label: "Высокий риск" };
}

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

function modelImage(m) {
  const brand = String(modelAttrs(m).brand || m.category || "?");
  const letter = brand.charAt(0).toUpperCase();
  const colors = catColors(m.category);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + colors[0] + '"/>' +
    '<stop offset="100%" stop-color="' + colors[1] + '"/></linearGradient></defs>' +
    '<rect width="100%" height="100%" fill="url(#g)"/>' +
    '<circle cx="480" cy="60" r="120" fill="rgba(255,255,255,0.12)"/>' +
    '<circle cx="80" cy="390" r="90" fill="rgba(255,255,255,0.10)"/>' +
    '<text x="50%" y="52%" font-family="Arial, sans-serif" font-size="200" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle" dominant-baseline="middle">' + letter + "</text>" +
    '<text x="50%" y="88%" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.75)" text-anchor="middle">' + m.category + "</text></svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function imgFallback(img) {
  const letter = (img.alt || "?").charAt(0);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">' +
    '<rect width="100%" height="100%" fill="#e6eaf7"/>' +
    '<text x="50%" y="50%" font-family="Arial" font-size="120" fill="#8a94c0" text-anchor="middle" dominant-baseline="middle">' + letter + "</text></svg>";
  img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
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

function isQualified(o) {
  return o.rating >= (state.priority.minRating || 4.3);
}

function passesPriority(o) {
  const p = state.priority;
  if (p.minRating && o.rating < p.minRating) return false;
  if (p.minSeller && Number(o.seller[1]) < p.minSeller) return false;
  if (p.minTrust && o.trust < p.minTrust) return false;
  if (p.minReviews && o.reviews < p.minReviews) return false;
  if (p.verified && !o.seller[5]) return false;
  return true;
}

function priorityActive() {
  const p = state.priority;
  return p.minRating || p.minSeller || p.minTrust || p.minReviews || p.verified;
}

function priorityHintText() {
  const p = state.priority;
  const parts = [];
  if (p.minRating) parts.push("оценка ≥ " + p.minRating);
  if (p.minSeller) parts.push("продавец ≥ " + p.minSeller);
  if (p.minTrust) parts.push("доверие ≥ " + p.minTrust + "%");
  if (p.minReviews) parts.push("от " + p.minReviews + " отзывов");
  if (p.verified) parts.push("только проверенные");
  return parts.join(" · ");
}

function bestOffer(list) {
  const qualified = list.filter(isQualified);
  if (!qualified.length) return null;
  let best = qualified[0];
  qualified.forEach(o => { if (o.price < best.price) best = o; });
  return best;
}

function visibleOffers(model) {
  let list = model.offers.slice();
  if (state.country !== "ALL") {
    list = list.filter(o => STORE_COUNTRIES[o.store] === state.country);
  }
  return list.filter(passesPriority);
}

function sortedOffers(list) {
  const sorted = list.slice();
  switch (state.sort) {
    case "cheap":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "expensive":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    default:
      sorted.sort((a, b) => {
        const qa = isQualified(a) ? 0 : 1;
        const qb = isQualified(b) ? 0 : 1;
        if (qa !== qb) return qa - qb;
        return a.price - b.price;
      });
  }
  return sorted;
}

function bestOffer(list) {
  const qualified = list.filter(isQualified);
  if (!qualified.length) return null;
  let best = qualified[0];
  qualified.forEach(o => { if (o.price < best.price) best = o; });
  return best;
}

function modelMeta(model) {
  const offs = visibleOffers(model);
  const minPrice = offs.length ? Math.min.apply(null, offs.map(o => o.price)) : 0;
  const avgPrice = offs.length ? offs.reduce((s, o) => s + o.price, 0) / offs.length : 0;
  const maxTrust = offs.length ? Math.max.apply(null, offs.map(o => o.trust)) : 0;
  const avgRating = offs.length ? offs.reduce((s, o) => s + o.rating, 0) / offs.length : 0;
  return { offs, minPrice, avgPrice, maxTrust, avgRating, storesCount: new Set(offs.map(o => o.store)).size };
}

function modelAttrs(m) {
  return m.attrs || MODEL_ATTRS[m.id] || {};
}

function attrValues(m, attrId) {
  const v = modelAttrs(m)[attrId];
  if (v == null) return null;
  return Array.isArray(v) ? v.map(String) : [String(v)];
}

function getFilterGroups(list) {
  const cats = [];
  list.forEach(m => { if (!cats.includes(m.category)) cats.push(m.category); });
  const groups = [];
  const seen = {};
  cats.forEach(cat => {
    (FILTER_DEFS[cat] || []).forEach(def => {
      const key = cat + "." + def.id;
      if (seen[key]) return;
      seen[key] = true;
      const options = {};
      list.forEach(m => {
        const vals = attrValues(m, def.id);
        if (!vals) return;
        vals.forEach(v => { options[v] = (options[v] || 0) + 1; });
      });
      const optList = Object.keys(options);
      if (!optList.length) return;
      groups.push({
        key: key,
        label: def.label,
        options: optList.sort().map(v => ({ value: v, count: options[v] }))
      });
    });
  });
  return groups;
}

function pruneFilters(list) {
  const groups = getFilterGroups(list);
  const valid = {};
  groups.forEach(g => g.options.forEach(o => { valid[g.key + "\u0000" + o.value] = true; }));
  Object.keys(state.filters).forEach(key => {
    state.filters[key] = state.filters[key].filter(v => valid[key + "\u0000" + v]);
    if (!state.filters[key].length) delete state.filters[key];
  });
}

function matchesFilters(m) {
  for (const key in state.filters) {
    const sel = state.filters[key];
    if (!sel.length) continue;
    const cat = key.slice(0, key.indexOf("."));
    const attrId = key.slice(key.indexOf(".") + 1);
    if (m.category !== cat) return false;
    const vals = attrValues(m, attrId);
    if (!vals) return false;
    if (!vals.some(v => sel.includes(v))) return false;
  }
  return true;
}

function countActive() {
  let n = 0;
  Object.keys(state.filters).forEach(k => { n += state.filters[k].length; });
  return n;
}

function renderFilters() {
  const base = baseModels();
  const groups = getFilterGroups(base);
  const wrap = document.getElementById("filter-groups");
  wrap.innerHTML = groups.map(g => {
    const sel = state.filters[g.key] || [];
    const opts = g.options.map(o =>
      '<label class="filter-option">' +
        '<input type="checkbox" data-group="' + g.key + '" value="' + o.value + '"' + (sel.includes(o.value) ? " checked" : "") + ">" +
        "<span>" + o.value + "</span>" +
        '<span class="opt-count">' + o.count + "</span>" +
      "</label>"
    ).join("");
    return '<div class="filter-group"><h4>' + g.label + "</h4>" + opts + "</div>";
  }).join("");
  document.getElementById("filter-reset").hidden = !Object.keys(state.filters).length;
  const n = countActive();
  const countEl = document.getElementById("filters-count");
  countEl.hidden = !n;
  countEl.textContent = n;
}

function baseModels() {
  let list = MODELS.slice();
  const q = state.query.trim().toLowerCase();
  if (q) {
    list = list.filter(m =>
      m.category.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.keywords.some(k => k.includes(q) || q.includes(k)) ||
      brandMatches(m, q)
    );
  }
  return list.filter(m => visibleOffers(m).length > 0);
}

function brandMatches(m, q) {
  const brand = String(modelAttrs(m).brand || "").toLowerCase();
  return brand.length > 2 && (q.includes(brand) || brand.includes(q));
}

function filterModels() {
  const list = baseModels();
  pruneFilters(list);
  return list.filter(matchesFilters);
}

function sortModels(list) {
  const sorted = list.slice();
  switch (state.sort) {
    case "cheap":
      sorted.sort((a, b) => modelMeta(a).avgPrice - modelMeta(b).avgPrice);
      break;
    case "expensive":
      sorted.sort((a, b) => modelMeta(b).avgPrice - modelMeta(a).avgPrice);
      break;
    case "rating":
      sorted.sort((a, b) => modelMeta(b).avgRating - modelMeta(a).avgRating);
      break;
    default:
      sorted.sort((a, b) => modelBestPrice(a) - modelBestPrice(b));
  }
  return sorted;
}

function modelBestPrice(m) {
  const offs = visibleOffers(m);
  const qualified = offs.filter(isQualified);
  const src = qualified.length ? qualified : offs;
  if (!src.length) return Infinity;
  return Math.min.apply(null, src.map(o => o.price));
}

function modelCardHTML(m, meta) {
  return '<article class="card" data-model="' + m.id + '">' +
    '<div class="card-img"><img src="' + modelImage(m) + '" alt="' + m.name + '" loading="lazy"></div>' +
    '<div class="card-body">' +
      '<div class="card-cat">' + m.category + "</div>" +
      '<h3 class="card-name">' + m.name + "</h3>" +
      '<div class="card-price-row">' +
        '<span class="card-price">~' + formatPrice(meta.avgPrice) + "</span>" +
        '<span class="card-avg">средняя цена</span>' +
      "</div>" +
      '<div class="card-meta">' +
        '<span class="card-stars">' + starsHTML(meta.avgRating) + " <b>" + meta.avgRating.toFixed(1).replace(".", ",") + "</b></span>" +
        '<span class="offer-count">' + meta.storesCount + " " + plural(meta.storesCount, "магазин", "магазина", "магазинов") + "</span>" +
      "</div>" +
    "</div>" +
  "</article>";
}

function renderModels() {
  const list = sortModels(filterModels());

  let title = "Каталог моделей";
  if (state.query.trim()) title = "Модели: «" + state.query.trim() + "»";
  else if (state.country !== "ALL") title = "Маркетплейсы: " + COUNTRY_NAMES[state.country];
  resultsTitle.textContent = title;
  resultsSub.textContent = "Выберите модель — увидите предложения всех маркетплейсов";
  resultsCount.textContent = "Найдено: " + list.length + " " + plural(list.length, "модель", "модели", "моделей") +
    (countActive() ? " · фильтры: " + countActive() : "");
  backBtn.hidden = true;

  grid.className = "grid";
  document.getElementById("filters-btn").hidden = false;
  renderFilters();

  if (!list.length) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyText.textContent = priorityActive()
      ? "Под ваши приоритеты ничего не нашлось. Снизьте пороги или сбросьте их в меню приоритетов."
      : (countActive()
        ? "Под такие фильтры ничего не нашлось. Попробуйте сбросить фильтры."
        : "По запросу «" + (state.query.trim() || "—") + "» ничего не найдено. Попробуйте изменить запрос или страну маркетплейсов.");
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = list.map(m => modelCardHTML(m, modelMeta(m))).join("");
}

function offerRowHTML(model, offer, isBest) {
  const discount = offer.old ? Math.round((1 - offer.price / offer.old) * 100) : 0;
  return '<article class="offer" data-model="' + model.id + '" data-offer="' + offer.store + '">' +
    (isBest ? '<div class="best-badge">Лучшее предложение</div>' : "") +
    '<div class="offer-store">' +
      '<div class="store-circle" style="background:' + storeColor(offer.store) + '">' + offer.store.charAt(0) + "</div>" +
      '<div>' +
        '<div class="offer-store-name">' + offer.store + ' <span class="store-country">· ' + COUNTRY_NAMES[STORE_COUNTRIES[offer.store]] + "</span></div>" +
        '<div class="offer-model">' + model.name + "</div>" +
      "</div>" +
    "</div>" +
    '<div class="offer-info">' +
      '<div class="offer-price-row">' +
        '<span class="offer-price">' + formatPrice(offer.price) + "</span>" +
        (offer.old ? '<span class="offer-old">' + formatPrice(offer.old) + "</span>" : "") +
        (discount ? '<span class="offer-discount">−' + discount + "%</span>" : "") +
      "</div>" +
      '<div class="offer-meta">' +
        '<span class="card-stars">' + starsHTML(offer.rating) + " <b>" + offer.rating + "</b></span>" +
        '<span class="offer-reviews">' + offer.reviews.toLocaleString("ru-RU") + " отзывов</span>" +
        '<span class="trust-pill ' + trustMeta(offer.trust).cls + '">' + offer.trust + "% доверия</span>" +
      "</div>" +
    "</div>" +
  "</article>";
}

function renderOffers(model) {
  const offs = sortedOffers(visibleOffers(model));
  const best = bestOffer(offs);

  resultsTitle.textContent = model.name;
  resultsSub.textContent = "Предложения маркетплейсов" + (state.country !== "ALL" ? " (" + COUNTRY_NAMES[state.country] + ")" : "");
  resultsCount.textContent = offs.length + " " + plural(offs.length, "предложение", "предложения", "предложений") +
    " · " + new Set(offs.map(o => o.store)).size + " " + plural(new Set(offs.map(o => o.store)).size, "маркетплейс", "маркетплейса", "маркетплейсов");
  backBtn.hidden = false;

  grid.className = "offers-grid";
  document.getElementById("filters-btn").hidden = true;

  if (!offs.length) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    emptyText.textContent = priorityActive()
      ? "В выбранной стране нет предложений, проходящих ваши приоритеты. Снизьте пороги или смените страну."
      : "В выбранной стране пока нет предложений для этой модели. Смените страну маркетплейсов.";
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = offs.map(o => offerRowHTML(model, o, best && o.store === best.store)).join("");
}

function render() {
  updatePriorityUI();
  if (state.modelId) {
    const model = MODELS.find(m => m.id === state.modelId);
    if (model) renderOffers(model);
    else renderModels();
  } else {
    renderModels();
  }
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

function panelHTML(model, offer) {
  const t = trustMeta(offer.trust);
  const trustList = offer.points.map(p =>
    '<li class="' + (p[0] ? "ok" : "no") + '">' + (p[0] ? "✓" : "✕") + " " + p[1] + "</li>"
  ).join("");
  const reviews = offer.reviews.map(r =>
    '<div class="review">' +
      '<div class="review-head">' +
        '<span class="review-author">' + r[0] + "</span>" +
        '<span class="review-stars">' + starsHTML(r[1]) + "</span>" +
      "</div>" +
      "<p>" + r[2] + "</p>" +
      '<span class="review-date">' + r[3] + "</span>" +
    "</div>"
  ).join("");
  const discount = offer.old ? Math.round((1 - offer.price / offer.old) * 100) : 0;

  return '<img class="panel-img" src="' + modelImage(model) + '" alt="' + model.name + '">' +
    '<div class="panel-store">' + offer.store + ' <span class="dot">•</span> ' + COUNTRY_NAMES[STORE_COUNTRIES[offer.store]] + "</div>" +
    '<h2 class="panel-title">' + model.name + "</h2>" +
    '<div class="panel-rating">' + starsHTML(offer.rating) + " <span>" + offer.rating + " · " + offer.reviews.toLocaleString("ru-RU") + " отзывов</span></div>" +
    '<div class="panel-price-row">' +
      '<span class="panel-price">' + formatPrice(offer.price) + "</span>" +
      (offer.old ? '<span class="panel-old">' + formatPrice(offer.old) + "</span>" : "") +
      (discount ? '<span class="panel-discount">−' + discount + "%</span>" : "") +
    "</div>" +
    '<p class="panel-desc">' + model.desc + "</p>" +
    '<a class="btn-buy" href="' + (offer.link || "#") + '" target="_blank" rel="noopener"' + (offer.link ? "" : ' onclick="return false"') + ">" +
    (offer.link ? "Перейти в магазин" : "Перейти в магазин") + "</a>" +
    '<p class="panel-note">' + (offer.link ? "Откроется страница товара на " + offer.store + "." : "Демо-версия: ссылка пока не ведёт на реальный магазин.") + "</p>" +
    '<div class="panel-block">' +
      "<h3>Индекс доверия <span class=\"trust-big " + t.cls + "\">" + offer.trust + "%</span></h3>" +
      '<ul class="trust-list">' + trustList + "</ul>" +
    "</div>" +
    '<div class="panel-block">' +
      "<h3>Продавец</h3>" +
      '<div class="seller-card">' +
        '<div class="seller-row"><b>' + offer.seller[0] + "</b>" + (offer.seller[5] ? '<span class="badge-ok">Проверен</span>' : "") + "</div>" +
        '<div class="seller-row muted">Рейтинг: ' + starsHTML(Number(offer.seller[1])) + " " + offer.seller[1] + "</div>" +
        '<div class="seller-row muted">Продаж: ' + offer.seller[2] + "</div>" +
        '<div class="seller-row muted">Отвечает: ' + offer.seller[3] + "</div>" +
        '<div class="seller-row muted">На площадке с ' + offer.seller[4] + " года</div>" +
      "</div>" +
    "</div>" +
    '<div class="panel-block">' +
      "<h3>Отзывы покупателей</h3>" +
      '<div class="reviews">' + reviews + "</div>" +
    "</div>";
}

function openPanel(model, offer) {
  panelContent.innerHTML = panelHTML(model, offer);
  panel.classList.add("open");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePanel() {
  panel.classList.remove("open");
  overlay.hidden = true;
  document.body.style.overflow = "";
}

function findModelIdByQuery(q) {
  const lower = q.toLowerCase();
  const exact = MODELS.find(m => m.name.toLowerCase() === lower);
  if (exact) return exact.id;
  const nameMatches = MODELS.filter(m => m.name.toLowerCase().includes(lower));
  if (nameMatches.length === 1) return nameMatches[0].id;
  return null;
}

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const q = document.getElementById("search-input").value.trim();
  state.query = q;
  state.modelId = findModelIdByQuery(q);
  state.filters = {};
  render();
  document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    state.query = chip.dataset.q;
    state.modelId = null;
    state.filters = {};
    document.getElementById("search-input").value = state.query;
    render();
    document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
  });
});

backBtn.addEventListener("click", function () {
  state.modelId = null;
  render();
  document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("filter-groups").addEventListener("change", function (e) {
  const cb = e.target;
  if (cb.dataset.group === undefined) return;
  const key = cb.dataset.group;
  let sel = state.filters[key] || [];
  if (cb.checked) {
    if (!sel.includes(cb.value)) sel.push(cb.value);
  } else {
    sel = sel.filter(v => v !== cb.value);
  }
  if (sel.length) state.filters[key] = sel;
  else delete state.filters[key];
  render();
});

document.getElementById("filter-reset").addEventListener("click", function () {
  state.filters = {};
  render();
});

const filtersPanel = document.getElementById("filters-panel");
const filtersOverlay = document.getElementById("filters-overlay");

document.getElementById("filters-btn").addEventListener("click", function () {
  renderFilters();
  filtersPanel.classList.add("open");
  filtersOverlay.hidden = false;
  document.body.style.overflow = "hidden";
});

function closeFilters() {
  filtersPanel.classList.remove("open");
  filtersOverlay.hidden = true;
  if (!panel.classList.contains("open") && !settingsPanel.classList.contains("open")) {
    document.body.style.overflow = "";
  }
}

document.getElementById("filters-close").addEventListener("click", closeFilters);
filtersOverlay.addEventListener("click", closeFilters);

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
  if (!panel.classList.contains("open") && !filtersPanel.classList.contains("open")) {
    document.body.style.overflow = "";
  }
}

document.getElementById("settings-close").addEventListener("click", closeSettings);
settingsOverlay.addEventListener("click", closeSettings);

[
  ["prio-rating", "minRating"],
  ["prio-seller", "minSeller"],
  ["prio-trust", "minTrust"],
  ["prio-reviews", "minReviews"]
].forEach(function (pair) {
  document.getElementById(pair[0]).addEventListener("change", function (e) {
    const v = e.target.value;
    state.priority[pair[1]] = v === "" ? null : Number(v);
    render();
  });
});

document.getElementById("prio-verified").addEventListener("change", function (e) {
  state.priority.verified = e.target.checked;
  render();
});

document.getElementById("settings-reset").addEventListener("click", function () {
  state.priority = { minRating: null, minSeller: null, minTrust: null, minReviews: null, verified: false };
  document.getElementById("prio-rating").value = "";
  document.getElementById("prio-seller").value = "";
  document.getElementById("prio-trust").value = "";
  document.getElementById("prio-reviews").value = "";
  document.getElementById("prio-verified").checked = false;
  render();
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

grid.addEventListener("click", function (e) {
  const modelCard = e.target.closest(".card[data-model]");
  if (modelCard) {
    state.modelId = modelCard.dataset.model;
    render();
    document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
    return;
  }
  const offerRow = e.target.closest(".offer");
  if (offerRow) {
    const model = MODELS.find(m => m.id === offerRow.dataset.model);
    const offer = model.offers.find(o => o.store === offerRow.dataset.offer);
    openPanel(model, offer);
  }
});

overlay.addEventListener("click", closePanel);
document.getElementById("panel-close").addEventListener("click", closePanel);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closePanel();
    closeSettings();
    closeFilters();
  }
});

document.getElementById("logo").addEventListener("click", function () {
  state.query = "";
  state.modelId = null;
  state.filters = {};
  document.getElementById("search-input").value = "";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

render();