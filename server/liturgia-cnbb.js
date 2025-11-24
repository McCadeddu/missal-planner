// server/liturgia-cnbb.js
import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3001;

app.get("/liturgia", async (req, res) => {
    try {
        const url = "https://liturgia.cnbb.org.br/pordata/";

        const html = await fetch(url).then(r => r.text());
        const $ = cheerio.load(html);

        const titulo = $(".entry-title").first().text().trim();
        const conteudo = $(".entry-content").html();

        res.json({
            status: "ok",
            titulo,
            html: conteudo
        });

    } catch (err) {
        res.json({ status: "error", message: err.message });
    }
});

app.listen(PORT, () =>
    console.log("Servidor CNBB rodando em: http://localhost:" + PORT)
);
