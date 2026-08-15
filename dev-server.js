const express = require("express");
const { searchProducts } = require("./lib/marketplaces");

const app = express();
app.use(express.static(__dirname));

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim().slice(0, 100);
  const country = String(req.query.country || "ALL").toUpperCase();
  if (!q) return res.json({ demo: false, products: [] });
  try {
    res.json(await searchProducts(q, country));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("BuyAAgoodprice running on http://localhost:" + port));