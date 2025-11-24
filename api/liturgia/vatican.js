// api/liturgia/vatican.js
import * as cheerio from "cheerio";

/**
 * Vercel Serverless function to proxy VaticanNews "word of the day".
 */
export default async function handler(req, res) {
  try {
    const url = "https://www.vaticannews.va/en/word-of-the-day.html";
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const html = await resp.text();
    const $ = cheerio.load(html);

    const titulo = $("h1").first().text().trim();
    const leituras = [];
    $("div.article__body p").each((i, el) => {
      leituras.push($(el).text().trim());
    });

    return res.status(200).json({ origem: "Vatican", titulo, leituras });
  } catch (err) {
    console.error("Vatican error:", err);
    return res.status(500).json({ error: "Erro ao carregar liturgia inglesa" });
  }
}
