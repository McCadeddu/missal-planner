import mammoth from "mammoth";

/**
 * Importa textos de cantos a partir de DOCX
 * Regra fixa:
 * - Cada TABELA inicia um novo canto
 * - O texto após a tabela pertence a esse canto
 * - O canto termina quando aparece outra tabela
 * - Tabela contém: TÍTULO | PÁGINA | NÚMERO
 */
export async function importWordLibrary(file, existingLibrary = []) {
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const bodyNodes = Array.from(doc.body.childNodes);

    const blocks = [];
    let currentBlock = null;

    for (const node of bodyNodes) {
        if (node.nodeType !== 1) continue; // ignora text nodes

        /* 🔹 TABELA = novo canto */
        if (node.nodeName === "TABLE") {
            if (currentBlock) {
                blocks.push(currentBlock);
            }

            const cells = Array.from(
                node.querySelectorAll("td")
            ).map(td => td.innerText.trim());

            // última célula = número do canto
            const numeroRaw = cells[cells.length - 1];
            const numero = numeroRaw
                ? String(Number(numeroRaw))
                : null;

            if (numero) {
                currentBlock = {
                    numero,
                    text: ""
                };
            } else {
                currentBlock = null;
            }

            continue;
        }

        /* 🔹 TEXTO DO CANTO ATUAL */
        if (currentBlock) {
            const content = node.innerText?.trim();
            if (content) {
                currentBlock.text += content + "\n";
            }
        }
    }

    if (currentBlock) {
        blocks.push(currentBlock);
    }

    /* 🔹 Aplicar à biblioteca */
    const updatedLibrary = [...existingLibrary];

    for (const { numero, text } of blocks) {
        if (!numero || !text.trim()) continue;

        let song = updatedLibrary.find(
            s => String(Number(s.numero)) === numero
        );

        if (!song) {
            song = {
                id: Date.now() + Math.random(),
                numero,
                nome: `Canto ${numero}`,
                composer: "",
                category: "Geral",
                tonality: "",
                fullTextProjection: "",
                fullTextMusic: ""
            };
            updatedLibrary.push(song);
        }

        song.fullTextProjection =
            `<p>${text.trim()
                .replace(/\n{2,}/g, "</p><p>")
                .replace(/\n/g, "<br/>")}</p>`;
    }

    return updatedLibrary;
}
