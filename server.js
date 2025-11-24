// server.js — Backend revisado e robusto
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* --------------------------------------------------------------
   Ajuste absoluto: resolve o caminho REAL do projeto
-------------------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// caminho absoluto e correto para cantos.csv
const dataDir = path.join(__dirname, "src", "data");
const csvPath = path.join(dataDir, "cantos.csv");

// garante que a pasta existe
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// garante que o arquivo CSV existe (com cabeçalho correto)
if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(
        csvPath,
        `"NOME DO CANTO","NÚMERO","COMPOSER","CATEGORIA"\n`,
        "utf8"
    );
}

/* --------------------------------------------------------------
   Servidor
-------------------------------------------------------------- */
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

/* --------------------------------------------------------------
   1) LITURGIA CNBB
-------------------------------------------------------------- */
app.get("/liturgia/cnbb", async (req, res) => {
    try {
        res.json({
            origem: "CNBB",
            leitura: "A liturgia da CNBB será integrada aqui futuramente."
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro CNBB" });
    }
});

/* --------------------------------------------------------------
   2) LITURGIA CEI (Itália)
-------------------------------------------------------------- */
app.get("/liturgia/cei", async (req, res) => {
    try {
        const url = "https://www.chiesacattolica.it/liturgia-del-giorno/";
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);

        const html = await response.text();
        const $ = cheerio.load(html);

        const titulo = $("h1").first().text().trim();
        const blocos = [];

        $("div.testo-liturgia p").each((i, el) => {
            blocos.push($(el).text().trim());
        });

        res.json({
            origem: "CEI",
            titulo,
            blocos
        });
    } catch (err) {
        console.error("Erro CEI:", err);
        res.status(500).json({ error: "Erro ao carregar liturgia italiana" });
    }
});

/* --------------------------------------------------------------
   3) LITURGIA VATICANO (EN)
-------------------------------------------------------------- */
app.get("/liturgia/vatican", async (req, res) => {
    try {
        const url = "https://www.vaticannews.va/en/word-of-the-day.html";
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP " + response.status);

        const html = await response.text();
        const $ = cheerio.load(html);

        const titulo = $("h1").first().text().trim();
        const leituras = [];

        $("div.article__body p").each((i, el) => {
            leituras.push($(el).text().trim());
        });

        res.json({
            origem: "Vatican",
            titulo,
            leituras
        });
    } catch (err) {
        console.error("Erro Vatican:", err);
        res.status(500).json({ error: "Erro ao carregar liturgia inglesa" });
    }
});

/* --------------------------------------------------------------
   4) API — ADICIONAR NOVO CANTO
-------------------------------------------------------------- */
app.post("/api/add-canto", (req, res) => {
    const { numero, nome, composer = "", category = "Geral" } = req.body;

    if (!nome || !numero) {
        return res.status(400).json({ error: "Número e nome são obrigatórios" });
    }

    const safe = (v) => v.replace(/"/g, '""');

    const linha = `"${safe(nome)}","${safe(numero)}","${safe(composer)}","${safe(category)}"\n`;

    fs.appendFile(csvPath, linha, "utf8", (err) => {
        if (err) {
            console.error("Erro ao salvar no CSV:", err);
            return res.status(500).json({ error: "Falha ao salvar canto" });
        }
        res.json({ ok: true });
    });
});

/* -------------------------------------------------------------- */
app.listen(PORT, () => {
    console.log("Servidor litúrgico em http://localhost:" + PORT);
});
