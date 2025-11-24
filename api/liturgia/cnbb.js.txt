// api/liturgia/cnbb.js
/**
 * Placeholder for CNBB (keeps parity with your original server).
 * You can later fill this with real scraping / API logic.
 */
export default async function handler(req, res) {
  try {
    return res.status(200).json({
      origem: "CNBB",
      leitura: "A liturgia da CNBB será integrada aqui futuramente."
    });
  } catch (err) {
    console.error("CNBB error:", err);
    return res.status(500).json({ error: "Erro CNBB" });
  }
}
