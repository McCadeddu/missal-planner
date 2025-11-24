// api/liturgia/cei.js
import * as cheerio from "cheerio";

/**
 * Vercel Serverless function to proxy CEI liturgy.
 */
export default async function handler(req, res) {
  try {
    const url = "https://www.chiesacattolica.it/liturgia-del-giorno/";
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const html = await resp.text();
    const $ = cheerio.load(html);

    const titulo = $("h1").first().text().trim();
    const blocos = [];
    $("div.testo-liturgia p").each((i, el) => {
      blocos.push($(el).text().trim());
    });

    return res.status(200).json({ origem: "CEI", titulo, blocos });
  } catch (err) {
    console.error("CEI error:", err);
    return res.status(500).json({ error: "Erro ao carregar liturgia italiana" });
  }
}
