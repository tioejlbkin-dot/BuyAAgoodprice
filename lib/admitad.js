const TOKEN_URL = "https://api.admitad.com/token/";
const API_BASE = "https://api.admitad.com";

let tokenCache = { token: null, expiresAt: 0 };

const MARKETPLACE_KEYWORDS = {
  RU: ["ozon", "wildberries", "aliexpress", "dns", "citilink", "яндекс маркет", "yandex market", "м.видео", "mvideo", "sbermegamarket", "мегамаркет", "eldorado", "технопарк"],
  US: ["amazon", "ebay", "aliexpress", "walmart", "best buy", "newegg", "target", "wayfair", "eastbay"],
  DE: ["amazon", "ebay", "aliexpress", "zalando", "otto", "mediamarkt", "saturn", "galaxus"],
  GB: ["amazon", "ebay", "aliexpress", "argos", "currys", "john lewis", "very", "sportsdirect"]
};

const campaignCache = {};

function normName(name) {
  return String(name || "").toLowerCase().replace(/[^\wа-яё ]+/g, " ").replace(/\s+/g, " ").trim();
}

async function getToken() {
  const clientId = process.env.ADMITAD_CLIENT_ID;
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "products_access"
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) throw new Error("Admitad token error " + res.status);
  const data = await res.json();
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return tokenCache.token;
}

async function apiGet(path, params) {
  const token = await getToken();
  if (!token) throw new Error("no-token");
  const qs = new URLSearchParams(params);
  const url = API_BASE + path + (qs.toString() ? "?" + qs : "");
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (res.status === 401) {
    tokenCache = { token: null, expiresAt: 0 };
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error("Admitad API " + res.status + " " + path);
  return res.json();
}

async function getCampaigns(country) {
  const key = country || "ALL";
  const cached = campaignCache[key];
  if (cached && Date.now() - cached.ts < 6 * 3600 * 1000) return cached.list;

  const keywords = MARKETPLACE_KEYWORDS[key] || [];
  const seen = new Map();
  const params = { limit: 500, status: "active" };
  if (key !== "ALL") params.country = key;

  for (const kw of keywords) {
    try {
      const data = await apiGet("/advcampaigns/", Object.assign({ q: kw }, params));
      const list = data.results || data.campaigns || [];
      for (const c of list) {
        if (c.status && c.status !== "active") continue;
        seen.set(String(c.id), {
          id: c.id,
          name: c.name,
          rating: Number(c.rating) || 0,
          currency: c.currency_code || "USD",
          country: c.country || key
        });
      }
    } catch (e) {}
  }
  const list = Array.from(seen.values());
  campaignCache[key] = { ts: Date.now(), list };
  return list;
}

function buildProductLink(campaign, productUrl) {
  const publisher = process.env.ADMITAD_PUBLISHER_ID;
  if (!publisher) return productUrl;
  return "https://go.admitad.com/goto/?offer_id=" + campaign.id +
    "&aff_id=" + publisher +
    "&url=" + encodeURIComponent(productUrl);
}

async function searchCampaign(campaign, q, limit) {
  const data = await apiGet("/advcampaigns/" + campaign.id + "/products/", {
    q: q,
    limit: limit,
    shop_status: "active"
  });
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