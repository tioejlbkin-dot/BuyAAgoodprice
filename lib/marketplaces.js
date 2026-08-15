const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const cache = new Map();

function cacheGet(key) {
  const c = cache.get(key);
  if (c && Date.now() - c.ts < 5 * 60 * 1000) return c.value;
  return null;
}

function cacheSet(key, value) {
  cache.set(key, { ts: Date.now(), value });
  if (cache.size > 200) {
    const oldest = [...cache.keys()][0];
    cache.delete(oldest);
  }
}

async function fetchRetry(url, headers, tries = 3, backoff = 2500) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: Object.assign({ "User-Agent": UA, Accept: "application/json, text/plain, */*" }, headers || {}),
        signal: AbortSignal.timeout(20000)
      });
      if (r.status === 429 && i < tries - 1) {
        await new Promise(res => setTimeout(res, backoff * (i + 1)));
        continue;
      }
      if (r.status === 403 || r.status === 404) return null;
      if (!r.ok) return null;
      return await r.text();
    } catch (e) {
      if (i === tries - 1) return null;
      await new Promise(res => setTimeout(res, backoff * (i + 1)));
    }
  }
  return null;
}

function trustFromRating(rating, fallback) {
  if (rating == null) return fallback || 70;
  const v = Math.round(rating * 20);
  return v > 0 ? v : fallback || 70;
}

function unescapeHtml(s) {
  return String(s || "")
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/g, "/");
}

const WB_URL = "https://search.wb.ru/exactmatch/ru/common/v4/search?appType=1&curr=rub&dest=-1257786&query=QUERY&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false";

async function wbSearch(q) {
  const cached = cacheGet("wb:" + q);
  if (cached) return cached;
  const html = await fetchRetry(WB_URL.replace("QUERY", encodeURIComponent(q)));
  if (!html) return [];
  let j;
  try { j = JSON.parse(html); } catch (e) { return []; }
  const out = (j.products || []).map(p => {
    const size = (p.sizes || []).find(s => s.price && s.price.product) || (p.sizes || [])[0];
    const price = size && size.price ? size.price.product / 100 : 0;
    return {
      id: String(p.id),
      name: String(p.name || ""),
      price: price,
      old: 0,
      image: "",
      link: "https://www.wildberries.ru/catalog/" + p.id + "/detail.aspx",
      store: "Wildberries",
      storeId: "wb",
      trust: trustFromRating(p.reviewRating || p.rating, 80),
      currency: "RUB",
      country: "RU",
      rating: p.reviewRating || p.rating || 0,
      reviews: p.feedbacks || p.nmFeedbacks || 0
    };
  }).filter(p => p.name && p.price > 0).slice(0, 24);
  cacheSet("wb:" + q, out);
  return out;
}

const YM_URL = "https://market.yandex.ru/search?text=QUERY";

function extractYmProducts(html) {
  const out = [];
  const seen = new Set();
  const re = /"product":\{/g;
  let m;
  while ((m = re.exec(html))) {
    const brace = m.index + m[0].length - 1;
    let depth = 0, end = -1;
    for (let k = brace; k < Math.min(html.length, brace + 200000); k++) {
      const ch = html[k];
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = k + 1; break; } }
    }
    if (end < 0) continue;
    re.lastIndex = end;
    try {
      const obj = JSON.parse(html.substring(brace, end));
      const items = obj && obj.entity === "product" ? [obj] : (obj ? Object.values(obj) : []);
      for (const p of items) {
        if (p && p.entity === "product" && p.id && !seen.has(p.id) && p.prices && p.prices.min) {
          seen.add(p.id);
          out.push(p);
        }
      }
    } catch (e) { /* skip malformed */ }
  }
  return out;
}

async function ymSearch(q) {
  const cached = cacheGet("ym:" + q);
  if (cached) return cached;
  const html = await fetchRetry(YM_URL.replace("QUERY", encodeURIComponent(q)), { "Accept-Language": "ru-RU,ru;q=0.9" });
  if (!html) return [];
  const products = extractYmProducts(html);
  const out = products.map(p => {
    const price = Number(p.prices.min) || 0;
    const slug = p.slug || "";
    return {
      id: String(p.id),
      name: unescapeHtml((p.titles && p.titles.raw) || ""),
      price: price,
      old: 0,
      image: p.pictures && p.pictures[0] ? "https://avatars.mds.yandex.net/get-mpic/" + p.pictures[0] + "/orig" : "",
      link: "https://market.yandex.ru/product--" + slug + "/" + p.id + "/",
      store: "Яндекс Маркет",
      storeId: "ym",
      trust: trustFromRating(p.rating, 80),
      currency: "RUB",
      country: "RU",
      rating: p.rating || 0,
      reviews: p.ratingCount || 0
    };
  }).filter(p => p.name && p.price > 0);
  cacheSet("ym:" + q, out);
  return out;
}

let ebayTokenCache = { token: null, expiresAt: 0 };

async function ebayToken() {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return null;
  if (ebayTokenCache.token && Date.now() < ebayTokenCache.expiresAt - 60000) return ebayTokenCache.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope"
  });
  const basic = Buffer.from(appId + ":").toString("base64");
  const r = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + basic
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) return null;
  const j = await r.json();
  ebayTokenCache.token = j.access_token;
  ebayTokenCache.expiresAt = Date.now() + (j.expires_in || 7200) * 1000;
  return ebayTokenCache.token;
}

const EBAY_COUNTRY = { US: "US", DE: "DE", GB: "GB", FR: "FR", IT: "IT", ES: "ES", CA: "CA", AU: "AU" };

async function ebaySearch(q, cc) {
  const country = EBAY_COUNTRY[cc];
  if (!country) return null;
  const key = "ebay:" + cc + ":" + q;
  const cached = cacheGet(key);
  if (cached) return cached;
  const token = await ebayToken();
  if (!token) return null;
  const url = "https://api.ebay.com/buy/browse/v1/item_summary/search?q=" + encodeURIComponent(q) +
    "&limit=24&filter=deliveryCountry:" + country;
  const r = await fetch(url, {
    headers: { Authorization: "Bearer " + token, "X-EBAY-C-MARKETPLACE-ID": "EBAY_" + country, "Accept": "application/json" },
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) return null;
  const j = await r.json();
  const out = (j.itemSummaries || []).map(it => ({
    id: it.itemId || it.title,
    name: it.title || "",
    price: Number(it.price && it.price.value) || 0,
    old: 0,
    image: it.image && it.image.imageUrl ? it.image.imageUrl : "",
    link: it.itemWebUrl || "",
    store: "eBay",
    storeId: "ebay",
    trust: trustFromRating(it.rating && it.rating.averageRating, 70),
    currency: it.price && it.price.currency ? it.price.currency : (cc === "US" ? "USD" : cc === "GB" ? "GBP" : "EUR"),
    country: cc,
    rating: it.rating ? it.rating.averageRating : 0,
    reviews: it.rating ? it.rating.reviewCount : 0
  })).filter(p => p.name && p.price > 0);
  cacheSet(key, out);
  return out;
}

async function searchProducts(q, country) {
  const tasks = [];
  if (country === "RU" || country === "ALL") {
    tasks.push(wbSearch(q).catch(() => []));
    tasks.push(ymSearch(q).catch(() => []));
  }
  if (EBAY_COUNTRY[country]) {
    tasks.push(ebaySearch(q, country).catch(() => null));
  }
  if (country === "ALL") {
    tasks.push(ebaySearch(q, "US").catch(() => null));
    tasks.push(ebaySearch(q, "DE").catch(() => null));
    tasks.push(ebaySearch(q, "GB").catch(() => null));
  }

  const results = await Promise.all(tasks);
  const products = [];
  const seen = new Set();
  let ebayMissing = false;
  for (const batch of results) {
    if (batch === null) { ebayMissing = true; continue; }
    for (const p of batch || []) {
      const key = p.storeId + ":" + p.id;
      if (seen.has(key)) continue;
      seen.add(key);
      products.push(p);
    }
  }

  if (!products.length) {
    const noKey = !process.env.EBAY_APP_ID && (EBAY_COUNTRY[country] || country === "ALL");
    if (noKey) {
      return {
        demo: false,
        query: q,
        country: country,
        products: [],
        warning: "Для этой страны нужен бесплатный ключ eBay API (5 минут): developer.ebay.com → Apps → Create App → EBAY_APP_ID"
      };
    }
    if (ebayMissing || country !== "RU" && country !== "ALL") {
      return { demo: false, query: q, country: country, products: [], warning: "eBay API не отвечает или ключ не задан" };
    }
    return { demo: true, query: q, country: country, products: [] };
  }

  return { demo: false, query: q, country: country, products: products };
}

module.exports = { searchProducts, wbSearch, ymSearch, ebaySearch };