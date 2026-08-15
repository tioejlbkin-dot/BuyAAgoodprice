const TOKEN_URL = "https://api.admitad.com/token/";
const API_BASE = "https://api.admitad.com";

let tokenCache = { token: null, expiresAt: 0, scope: "" };

const MARKETPLACE_KEYWORDS = {
  RU: ["ozon", "wildberries", "aliexpress", "dns", "citilink", "м.видео", "mvideo", "мегамаркет", "sber", "эльдорадо", "eldorado", "яндекс маркет", "technopark", "технопарк"],
  US: ["amazon", "ebay", "aliexpress", "walmart", "best buy", "newegg", "target", "wayfair"],
  DE: ["amazon", "ebay", "aliexpress", "zalando", "otto", "mediamarkt", "saturn", "galaxus"],
  GB: ["amazon", "ebay", "aliexpress", "argos", "currys", "john lewis", "very", "sportsdirect"]
};

const campaignCache = {};

function normName(name) {
  return String(name || "").toLowerCase().replace(/[^\wа-яё ]+/g, " ").replace(/\s+/g, " ").trim();
}

async function getToken(scope) {
  const clientId = process.env.ADMITAD_CLIENT_ID;
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope || "advcampaigns products"
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Admitad token error " + res.status);
  const data = await res.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  tokenCache.scope = data.scope || "";
  return tokenCache.token;
}

async function apiGet(path, params) {
  let token = await getToken();
  if (!token) return null;
  const qs = new URLSearchParams(params);
  const url = API_BASE + path + (qs.toString() ? "?" + qs : "");
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 401) {
    tokenCache = { token: null, expiresAt: 0, scope: "" };
    token = await getToken();
    if (!token) return null;
    const res2 = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    return res2.ok ? res2.json() : null;
  }
  if (!res.ok) return null;
  return res.json();
}

async function fetchAllCampaigns(country) {
  const pages = [];
  for (let off = 0; off < 2000; off += 500) {
    const data = await apiGet("/advcampaigns/", { country: country, limit: 500, offset: off, status: "active" });
    if (!data || !data.results || !data.results.length) break;
    pages.push(...data.results);
  }
  return pages;
}

async function getCampaigns(country) {
  const key = country || "ALL";
  const cached = campaignCache[key];
  if (cached && Date.now() - cached.ts < 6 * 3600 * 1000) return cached.list;

  const keywords = (MARKETPLACE_KEYWORDS[key] || []);
  const seen = new Map();

  if (key === "ALL") {
    for (const cc of ["RU", "US", "DE", "GB"]) {
      const pages = await fetchAllCampaigns(cc);
      for (const c of pages) {
        const name = String(c.name || "").toLowerCase();
        if (!keywords.some(k => name.includes(k.toLowerCase()))) continue;
        seen.set(String(c.id), {
          id: c.id, name: c.name, rating: Number(c.rating) || 0,
          currency: c.currency || "USD", country: c.country || cc
        });
      }
    }
  } else {
    const pages = await fetchAllCampaigns(key);
    for (const c of pages) {
      const name = String(c.name || "").toLowerCase();
      if (!keywords.some(k => name.includes(k.toLowerCase()))) continue;
      seen.set(String(c.id), {
        id: c.id, name: c.name, rating: Number(c.rating) || 0,
        currency: c.currency || "USD", country: c.country || key
      });
    }
  }

  const list = Array.from(seen.values());
  campaignCache[key] = { ts: Date.now(), list };
  return list;
}

function buildProductLink(campaign, productUrl) {
  const publisher = process.env.ADMITAD_PUBLISHER_ID;
  if (!publisher || !productUrl) return productUrl || "";
  return "https://go.admitad.com/goto/?offer_id=" + campaign.id +
    "&aff_id=" + publisher +
    "&url=" + encodeURIComponent(productUrl);
}

async function searchCampaign(campaign, q, limit) {
  const data = await apiGet("/advcampaigns/" + campaign.id + "/products/", {
    q: q, limit: limit, shop_status: "active"
  });
  if (!data) return [];
  const items = data.results || data.products || [];
  return items.map(p => {
    const price = Number(p.price);
    const old = Number(p.oldprice || p.price_old || 0);
    return {
      id: String(campaign.id) + "-" + String(p.product_id || p.slug || normName(p.name)),
      name: p.name,
      price: isFinite(price) ? price : 0,
      old: isFinite(old) && old > price ? old : 0,
      image: p.image || "",
      link: buildProductLink(campaign, p.link || p.url || ""),
      store: p.shop_name || campaign.name,
      storeId: campaign.id,
      campaign: campaign.name,
      trust: campaign.rating,
      currency: campaign.currency,
      country: campaign.country,
      rating: campaign.rating,
      reviews: 0
    };
  });
}

async function searchProducts(q, country) {
  if (!process.env.ADMITAD_CLIENT_ID || !process.env.ADMITAD_CLIENT_SECRET) {
    return { demo: true, query: q, country: country, products: [] };
  }
  const campaigns = await getCampaigns(country);
  const top = campaigns.slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const results = await Promise.all(top.map(c => searchCampaign(c, q, 12).catch(() => [])));
  const seen = new Set();
  const products = [];
  for (const batch of results) {
    for (const p of batch) {
      if (!p.name || !p.price) continue;
      const key = normName(p.name);
      if (seen.has(key)) continue;
      seen.add(key);
      products.push(p);
    }
  }
  products.sort((a, b) => a.price - b.price);
  return { demo: false, query: q, country: country, products: products };
}

module.exports = { searchProducts, getToken };