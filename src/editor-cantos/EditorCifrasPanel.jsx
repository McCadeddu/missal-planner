import React, { useEffect, useMemo, useState } from "react";
import { transposeText } from "./chordUtils";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * EditorCifrasPanel
 * - Estilo Louvor Cifrado
 * - Alinhamento cifras/letra
 * - Transposição real
 * - Estrutura litúrgica (Intro / Estrofe / Refrão / etc.)
 * - Salva texto + tonalidade
 */
export default function EditorCifrasPanel({ song, onSave }) {
    const [rawText, setRawText] = useState(song.fullTextMusic || "");
    const [originalKey, setOriginalKey] = useState(song.tonality || "C");
    const [targetKey, setTargetKey] = useState(song.tonality || "C");

    /* ================================
       ZOOM (aumentar / reduzir texto)
       ================================ */
    const [fontScale, setFontScale] = useState(1);

    /* ===========================
       Helpers de inserção
       =========================== */
    const insertAtCursor = (textToInsert) => {
        const textarea = document.getElementById("cifras-editor");
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const before = rawText.slice(0, start);
        const after = rawText.slice(end);

        const newText = before + textToInsert + after;
        setRawText(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart =
                textarea.selectionEnd =
                start + textToInsert.length;
        }, 0);
    };

    const insertMarker = (marker) => {
        insertAtCursor(`\n[${marker}]\n`);
    };

    const insertRepeat = (times) => {
        insertAtCursor(` (${times}x)`);
    };

    /* ===========================
       Sincronizar canto carregado
       =========================== */
    useEffect(() => {
        setRawText(song.fullTextMusic || "");
        setOriginalKey(song.tonality || "C");
        setTargetKey(song.tonality || "C");
    }, [song.id]);

    /* ===========================
       Transposição
       =========================== */
    const semitones =
        NOTES.indexOf(targetKey) - NOTES.indexOf(originalKey);

    const transposedText = useMemo(() => {
        return transposeText(rawText, semitones);
    }, [rawText, semitones]);

    /* ===========================
       Preview Texto Cifrado
       =========================== */
    const previewHTML = useMemo(() => {
        let currentBlock = "verse";

        return transposedText
            .split("\n")
            .map((line) => {
                const trimmed = line.trim();

                if (trimmed === "[I]") {
                    currentBlock = "intro";
                    return `<span class="lc-marker">Intro</span>\n`;
                }
                if (trimmed === "[V]") {
                    currentBlock = "verse";
                    return `<span class="lc-marker">Estrofe</span>\n`;
                }
                if (trimmed === "[R]") {
                    currentBlock = "refrain";
                    return `<span class="lc-marker">Refrão</span>\n`;
                }
                if (trimmed === "[P]") {
                    currentBlock = "bridge";
                    return `<span class="lc-marker">Ponte</span>\n`;
                }
                if (trimmed === "[F]") {
                    currentBlock = "final";
                    return `<span class="lc-marker">Final</span>\n`;
                }

                if (!trimmed) return "\n";

                const safe = line
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");

                const chordMatches = line.match(
                    /\b[A-G][#b]?(?:m|min|maj|dim|aug)?\d*(?:sus\d)?(?:\/[A-G][#b]?)?\b/g
                );

                const isChordLine =
                    chordMatches &&
                    chordMatches.join("").length < trimmed.length;

                const typeClass = isChordLine ? "lc-chords" : "lc-lyrics";
                const blockClass = `lc-${currentBlock}`;

                return `<span class="${typeClass} ${blockClass}">${safe}</span>\n`;
            })
            .join("");
    }, [transposedText]);

    /* ===========================
       Salvar
       =========================== */
    const handleSave = () => {
        onSave?.({
            text: rawText,
            tonality: targetKey
        });
    };

    /* ===========================
       UI
       =========================== */
    return (
        <div className="cmv-card animate-fade">

            {/* BARRA LITÚRGICA */}
            <div
                className="cmv-card"
                style={{
                    marginBottom: 16,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    background: "linear-gradient(180deg, rgba(246,196,69,0.18), #fff)"
                }}
            >
                <button className="btn-cmv-outline" onClick={() => insertMarker("I")}>🎼 Intro</button>
                <button className="btn-cmv-outline" onClick={() => insertMarker("V")}>📖 Estrofe</button>
                <button className="btn-cmv-outline" onClick={() => insertMarker("R")}>🔁 Refrão</button>
                <button className="btn-cmv-outline" onClick={() => insertMarker("P")}>🌉 Ponte</button>

                <div style={{ width: 1, background: "#c77e4a", margin: "0 6px" }} />

                <button className="btn-cmv-outline" onClick={() => insertRepeat(2)}>2×</button>
                <button className="btn-cmv-outline" onClick={() => insertRepeat(3)}>3×</button>
                <button className="btn-cmv-outline" onClick={() => insertRepeat(5)}>5×</button>
            </div>

            {/* CONTROLES */}
            <div
                className="cmv-card"
                style={{
                    background: "linear-gradient(180deg, rgba(31,111,178,0.12), #fff)",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 16
                }}
            >
                <div>
                    <label className="tooltip-cmv">Tom original</label>
                    <select
                        className="cmv-input"
                        value={originalKey}
                        onChange={(e) => setOriginalKey(e.target.value)}
                    >
                        {NOTES.map((n) => <option key={n}>{n}</option>)}
                    </select>
                </div>

                <div>
                    <label className="tooltip-cmv">Transpor para</label>
                    <select
                        className="cmv-input"
                        value={targetKey}
                        onChange={(e) => setTargetKey(e.target.value)}
                    >
                        {NOTES.map((n) => <option key={n}>{n}</option>)}
                    </select>
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button className="btn-cmv-outline" onClick={() => setFontScale(v => Math.max(0.7, v - 0.1))}>A−</button>
                    <span className="tooltip-cmv">{Math.round(fontScale * 100)}%</span>
                    <button className="btn-cmv-outline" onClick={() => setFontScale(v => Math.min(1.8, v + 0.1))}>A+</button>
                </div>
            </div>

            {/* EDITOR + PREVIEW */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <textarea
                    id="cifras-editor"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Cole aqui a cifra com acordes sobre a letra"
                    style={{
                        minHeight: "60vh",
                        fontFamily: "monospace",
                        fontSize: `${15 * fontScale}px`,
                        lineHeight: 1.7,
                        padding: 16,
                        borderRadius: 12,
                        border: "2px solid var(--cmv-border)",
                        background: "rgba(122,74,46,0.04)",
                        whiteSpace: "pre"
                    }}
                />

                <pre
                    className="cmv-border lc-preview"
                    style={{ fontSize: `${15 * fontScale}px` }}
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                />
            </div>

            {/* AÇÕES */}
            <div style={{ textAlign: "right", marginTop: 16 }}>
                <button className="btn-cmv-outline" onClick={handleSave}>
                    💾 Salvar cifras
                </button>
            </div>

            {/* ESTILOS */}
            <style>{`
                .lc-preview {
                    min-height: 60vh;
                    padding: 16px;
                    font-family: monospace;
                    line-height: 1.3;
                    white-space: pre;
                    background: linear-gradient(180deg, rgba(246,196,69,0.12), #fff);
                }
                .lc-chords { color: #1f4fa3; font-weight: bold; }
                .lc-lyrics { color: #5c2e09; }
                .lc-marker {
                    display: block;
                    margin: 12px 0 6px;
                    font-weight: bold;
                    color: #876348;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .lc-refrain { background: rgba(246,196,69,0.15); border-left: 4px solid #f6c445; padding-left: 8px; }
                .lc-bridge { background: rgba(31,79,163,0.08); border-left: 4px solid #1f4fa3; padding-left: 8px; }
                .lc-final { background: rgba(122,74,46,0.08); border-left: 4px solid #5c2e09; padding-left: 8px; }
            `}</style>
        </div>
    );
}
