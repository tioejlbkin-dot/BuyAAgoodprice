const { searchProducts } = require("../lib/admitad");

module.exports = async function (req, res) {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const country = String(req.query.country || "ALL").toUpperCase();
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (!q) return res.json({ demo: false, products: [] });
  try {
    const result = await searchProducts(q, country);
    res.json(result);
  } catch (e) {
    if (e.message === "no-token") {
      res.json({ demo: true, error: "API не подключён: задайте ADMITAD_CLIENT_ID и ADMITAD_CLIENT_SECRET" });
    } else if (e.message === "unauthorized") {
      res.json({ demo: true, error: "Неверный токен Admitad — проверьте client_id/client_secret" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
};