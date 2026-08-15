const { searchProducts } = require("../lib/marketplaces");

module.exports = async function (req, res) {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const country = String(req.query.country || "ALL").toUpperCase();
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (!q) return res.json({ demo: false, products: [] });
  try {
    const result = await searchProducts(q, country);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};