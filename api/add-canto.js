// api/add-canto.js
/**
 * Adds a new song line to a CSV.
 *
 * Two modes:
 * 1) If env vars GITHUB_TOKEN and GITHUB_REPO are set: commit (append) to file in that repo.
 *    - GITHUB_REPO format: "owner/repo"
 *    - GITHUB_FILEPATH optional: path to the CSV inside the repo (default: "src/data/cantos.csv")
 *
 * 2) Otherwise: write to temporary file on serverless filesystem (/tmp/cantos.csv) and return its content.
 *    Note: /tmp is ephemeral (not persistent across invocations).
 */
import { Buffer } from "buffer";

const GITHUB_API = "https://api.github.com";

const safe = (v) => String(v ?? "").replace(/"/g, '""');

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { numero, nome, composer = "", category = "Geral" } = req.body ?? {};

    if (!nome || !numero) return res.status(400).json({ error: "Número e nome são obrigatórios" });

    const line = `"${safe(nome)}","${safe(numero)}","${safe(composer)}","${safe(category)}"\n`;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // owner/repo
    const GITHUB_FILEPATH = process.env.GITHUB_FILEPATH || "src/data/cantos.csv";

    if (GITHUB_TOKEN && GITHUB_REPO) {
      // 1) try to fetch file metadata / content
      const [owner, repo] = GITHUB_REPO.split("/");
      const contentsUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(GITHUB_FILEPATH)}`;

      // fetch current file
      const getResp = await fetch(contentsUrl, {
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
      });

      let sha = null;
      let existing = "";
      if (getResp.ok) {
        const json = await getResp.json();
        sha = json.sha;
        existing = Buffer.from(json.content, json.encoding).toString("utf8");
      } else if (getResp.status === 404) {
        // file does not exist, create with header + line
        existing = `"NOME DO CANTO","NÚMERO","COMPOSER","CATEGORIA"\n`;
      } else {
        const txt = await getResp.text();
        console.warn("GitHub get file failed:", getResp.status, txt);
        // fallback to non-github
      }

      const newContent = existing + line;
      const encoded = Buffer.from(newContent, "utf8").toString("base64");

      const body = {
        message: "Add canto via Vercel API",
        content: encoded,
      };
      if (sha) body.sha = sha;

      const putResp = await fetch(contentsUrl, {
        method: "PUT",
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
        body: JSON.stringify(body),
      });

      if (!putResp.ok) {
        const errTxt = await putResp.text();
        console.error("GitHub commit failed:", putResp.status, errTxt);
        return res.status(500).json({ error: "Falha ao gravar no GitHub" });
      }

      return res.status(200).json({ ok: true, persisted: "github", file: GITHUB_FILEPATH });
    }

    // 2) fallback: write to /tmp (ephemeral)
    const fs = await import("fs");
    const tmpPath = "/tmp/cantos.csv";
    if (!fs.existsSync(tmpPath)) {
      fs.writeFileSync(tmpPath, `"NOME DO CANTO","NÚMERO","COMPOSER","CATEGORIA"\n`, "utf8");
    }
    fs.appendFileSync(tmpPath, line, "utf8");
    const content = fs.readFileSync(tmpPath, "utf8");
    return res.status(200).json({ ok: true, persisted: "tmp", content });
  } catch (err) {
    console.error("add-canto error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
