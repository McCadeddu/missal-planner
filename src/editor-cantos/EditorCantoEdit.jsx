// ===========================
        EditorCantoEdit
// ===========================

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";

import EditorCifrasPanel from "./EditorCifrasPanel";

const AUTOSAVE_LIBRARY = "mp_library_v1";

/* ===========================
   Componente
   =========================== */

export default function EditorCantoEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    const initialMode = searchParams.get("mode") === "music"
        ? "music"
        : "projection";

    const [song, setSong] = useState(null);
    const [mode, setMode] = useState(initialMode);

    const [bufferProjection, setBufferProjection] = useState("");
    const [bufferMusic, setBufferMusic] = useState("");

    const lastLoadedId = useRef(null);
    const lastMode = useRef(null);

    /* ===========================
       Editor TipTap (SÓ projeção)
       =========================== */

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                underline: false
            }),
            TextStyle,
            Color,
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"]
            })
        ],
        content: "",
        autofocus: true
    });

    /* ===========================
       Carregar canto
       =========================== */

    useEffect(() => {
        if (!editor) return;

        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);
            const found = lib.find((s) => String(s.id) === id);
            if (!found) return;

            const normalized = {
                ...found,
                fullTextProjection: found.fullTextProjection || found.fullText || "",
                fullTextMusic: found.fullTextMusic || ""
            };

            setSong(normalized);

            if (mode === "projection") {
                editor.commands.setContent(
                    normalized.fullTextProjection || "<p></p>"
                );
            }
        } catch (e) {
            console.error(e);
        }
    }, [id, mode, editor]);

    /* ===========================
       Salvar
       =========================== */

    const saveText = () => {
        if (!song) return;

        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);

            const updatedSong =
                mode === "projection"
                    ? { ...song, fullTextProjection: editor.getHTML() }
                    : song; // 🔴 cifras NÃO salvam aqui

            const updatedLib = lib.map((s) =>
                s.id === song.id ? updatedSong : s
            );

            localStorage.setItem(
                AUTOSAVE_LIBRARY,
                JSON.stringify(updatedLib)
            );

            setSong(updatedSong);
            alert("Texto salvo com sucesso.");
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar.");
        }
    };

    /* ================================================
       Salvar metadados (título, compositor, categoria)
       ================================================ */
    const saveMetadata = (updates) => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);

            const updatedSong = {
                ...song,
                ...updates
            };

            const updatedLib = lib.map((s) =>
                s.id === song.id ? updatedSong : s
            );

            localStorage.setItem(
                AUTOSAVE_LIBRARY,
                JSON.stringify(updatedLib)
            );

            setSong(updatedSong);
        } catch (e) {
            console.error("Erro ao salvar metadados:", e);
            alert("Erro ao salvar dados do canto.");
        }
    };

    /* ===========================
       Eliminar canto
       =========================== */

    const deleteSong = () => {
        if (!song) return;

        if (
            !window.confirm(
                `Tem certeza que deseja eliminar o canto?\n\n${song.numero || ""} ${song.nome}`
            )
        ) {
            return;
        }

        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);
            const updated = lib.filter((s) => s.id !== song.id);

            localStorage.setItem(
                AUTOSAVE_LIBRARY,
                JSON.stringify(updated)
            );

            alert("Canto eliminado da biblioteca.");
            navigate("/editor-cantos");
        } catch (e) {
            console.error(e);
            alert("Erro ao eliminar o canto.");
        }
    };

    if (!song || (mode === "projection" && !editor)) {
        return <p style={{ padding: 20 }}>Carregando editor…</p>;
    }

    /* ===========================
       UI
       =========================== */

    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            {/* Header */}
            <div
                className="cmv-card animate-fade"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    margin: "12px",
                    background: "linear-gradient(180deg, rgba(31,111,178,0.08), #ffffff)"
                }}
            >
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <button onClick={() => navigate("/editor-cantos")}>
                        ⬅ Voltar
                    </button>

                    <h2 style={{ margin: 0 }}>
                        {song.numero ? `${song.numero} — ` : ""}
                        {song.nome}
                    </h2>
                </div>

                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                    <option value="projection">🎥 Texto para projeção</option>
                    <option value="music">🎵 Texto para músicos</option>
                </select>
            </div>

            {/* METADADOS DO CANTO */}
            <div
                className="cmv-card"
                style={{
                    margin: "12px",
                    background: "linear-gradient(180deg, rgba(246,196,69,0.12), #fff)",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: 12
                }}
            >
                {/* TÍTULO */}
                <div>
                    <label className="tooltip-cmv">Título do canto</label>
                    <input
                        className="cmv-input"
                        value={song.nome || ""}
                        onChange={(e) =>
                            saveMetadata({ nome: e.target.value })
                        }
                    />
                </div>

                {/* COMPOSITOR */}
                <div>
                    <label className="tooltip-cmv">Compositor</label>
                    <input
                        className="cmv-input"
                        value={song.composer || ""}
                        onChange={(e) =>
                            saveMetadata({ composer: e.target.value })
                        }
                    />
                </div>

                {/* CATEGORIA */}
                <div>
                    <label className="tooltip-cmv">Categoria</label>
                    <input
                        className="cmv-input"
                        value={song.category || ""}
                        onChange={(e) =>
                            saveMetadata({ category: e.target.value })
                        }
                    />
                </div>
            </div>

            {/* Toolbar — SOMENTE projeção */}
            {mode === "projection" && (
                <div
                    className="cmv-card"
                    style={{
                        margin: "12px",
                        background: "linear-gradient(180deg, rgba(246,196,69,0.15), #fff)",
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Negrito"
                    >
                        B
                    </button>

                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Itálico"
                    >
                        I
                    </button>

                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        title="Sublinhado"
                    >
                        U
                    </button>

                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().setTextAlign("left").run()}
                        title="Alinhar à esquerda"
                    >
                        ⬅
                    </button>

                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().setTextAlign("center").run()}
                        title="Centralizar"
                    >
                        ⬍
                    </button>

                    <button
                        className="btn-lit btn-lit-sun"
                        onClick={() => editor.chain().focus().setTextAlign("right").run()}
                        title="Alinhar à direita"
                    >
                        ➡
                    </button>
                    <input
                        type="color"
                        onChange={(e) =>
                            editor.chain().focus().setColor(e.target.value).run()
                        }
                    />
                </div>
            )}

            {/* Editor */}
            <div
                className="cmv-card cmv-border"
                style={{
                    margin: "12px",
                    minHeight: "60vh",
                    background: "linear-gradient(180deg, rgba(122,74,46,0.04), #ffffff)"
                }}
            >

                {/* 🎥 PROJEÇÃO */}
                {mode === "projection" && <EditorContent editor={editor} />}

                {/* 🎵 MÚSICOS */}
                {mode === "music" && (
                    <EditorCifrasPanel
                        song={song}
                        onSave={({ text, tonality }) => {
                            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
                            if (!raw) return;

                            const lib = JSON.parse(raw);

                            const updatedLib = lib.map((s) => {
                                if (s.id !== song.id) return s;

                                return {
                                    ...s,
                                    fullTextMusic: text,      // 🔒 exclusivo
                                    tonality: tonality ?? s.tonality
                                };
                            });

                            localStorage.setItem(
                                AUTOSAVE_LIBRARY,
                                JSON.stringify(updatedLib)
                            );

                            setSong((prev) => ({
                                ...prev,
                                fullTextMusic: text,
                                tonality
                            }));

                            alert("Cifras salvas com sucesso.");
                        }}
                    />
                )}

            </div>

            <div style={{ padding: 12, display: "flex", gap: 12 }}>
                {mode === "projection" && (
                    <button onClick={saveText} className="btn-cmv-outline">
                        💾 Salvar texto
                    </button>
                )}
            </div>
        </div>
    );
}
