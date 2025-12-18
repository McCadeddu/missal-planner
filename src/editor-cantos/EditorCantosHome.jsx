import { importWordLibrary } from "./importWordLibrary";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTOSAVE_LIBRARY = "mp_library_v1";

export default function EditorCantosHome() {
    const navigate = useNavigate();

    const [songs, setSongs] = useState([]);
    const [search, setSearch] = useState("");

    const [selectedSong, setSelectedSong] = useState(null);
    const [songToDelete, setSongToDelete] = useState(null);

    const [sortBy, setSortBy] = useState("numero");
    const [sortDir, setSortDir] = useState("asc");

    /* ===========================
       Importação Word
       =========================== */
    const handleImportWord = async (file) => {
        if (!file) return;

        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            const existing = raw ? JSON.parse(raw) : [];

            const updated = await importWordLibrary(file, existing);

            localStorage.setItem(
                AUTOSAVE_LIBRARY,
                JSON.stringify(updated)
            );
            setSongs(updated);

            alert("Biblioteca importada com sucesso!");
        } catch (err) {
            console.error(err);
            alert("Erro ao importar o documento Word.");
        }
    };

    /* ===========================
       Carregar biblioteca
       =========================== */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setSongs(parsed);
        } catch (e) {
            console.error("Erro ao carregar biblioteca:", e);
        }
    }, []);

    /* ===========================
       Filtro + ordenação
       =========================== */
    const filteredSongs = useMemo(() => {
        const q = search.toLowerCase().trim();
        return songs.filter((s) =>
            !q ||
            String(s.numero || "").includes(q) ||
            (s.nome || "").toLowerCase().includes(q) ||
            (s.category || "").toLowerCase().includes(q) ||
            (s.tonality || "").toLowerCase().includes(q)
        );
    }, [songs, search]);

    const sortedSongs = useMemo(() => {
        const arr = [...filteredSongs];

        arr.sort((a, b) => {
            let A = a[sortBy] ?? "";
            let B = b[sortBy] ?? "";

            if (sortBy === "numero") {
                A = Number(A) || 0;
                B = Number(B) || 0;
            } else {
                A = A.toString().toLowerCase();
                B = B.toString().toLowerCase();
            }

            if (A < B) return sortDir === "asc" ? -1 : 1;
            if (A > B) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return arr;
    }, [filteredSongs, sortBy, sortDir]);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDir("asc");
        }
    };

    const sortIcon = (field) =>
        sortBy === field ? (sortDir === "asc" ? " ▲" : " ▼") : "";

    /* ===========================
       Unificar cantos repetidos
       =========================== */
    const unifyRepeatedSongs = () => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);
            const map = new Map();

            for (const song of lib) {
                const numero = String(song.numero || "").trim();
                if (!numero) continue;

                if (!map.has(numero)) {
                    map.set(numero, { ...song });
                    continue;
                }

                const existing = map.get(numero);

                if ((song.nome || "").length > (existing.nome || "").length) {
                    existing.nome = song.nome;
                }

                const cats = new Set(
                    `${existing.category || ""},${song.category || ""}`
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean)
                );
                existing.category = Array.from(cats).join(", ") || "Geral";

                if (!existing.tonality && song.tonality)
                    existing.tonality = song.tonality;

                if (!existing.fullTextProjection && song.fullTextProjection)
                    existing.fullTextProjection = song.fullTextProjection;

                if (!existing.fullTextMusic && song.fullTextMusic)
                    existing.fullTextMusic = song.fullTextMusic;
            }

            const unified = Array.from(map.values());
            localStorage.setItem(AUTOSAVE_LIBRARY, JSON.stringify(unified));
            setSongs(unified);

            alert(`Unificação concluída!\nAntes: ${lib.length}\nAgora: ${unified.length}`);
        } catch (e) {
            console.error(e);
            alert("Erro ao unificar cantos.");
        }
    };

    /* ===========================
       Normalizar biblioteca
       =========================== */
    const normalizeLibrary = () => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
            if (!raw) return;

            const lib = JSON.parse(raw);

            const normalized = lib.map((s, index) => ({
                ...s,
                id: index + 1,
                numero: String(s.numero || "").replace(/^0+/, "").trim(),
                nome: (s.nome || "").replace(/\s+/g, " ").trim(),
                category: Array.from(
                    new Set(
                        (s.category || "Geral")
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean)
                    )
                ).join(", "),
                tonality: (s.tonality || "").toUpperCase().trim(),

                // 🔒 PRESERVAÇÃO ABSOLUTA
                fullTextProjection: s.fullTextProjection || "",
                fullTextMusic: s.fullTextMusic || ""
            }));

            localStorage.setItem(AUTOSAVE_LIBRARY, JSON.stringify(normalized));
            setSongs(normalized);

            alert("Biblioteca normalizada com sucesso.");
        } catch (e) {
            console.error(e);
            alert("Erro ao normalizar biblioteca.");
        }
    };

    /* ===========================
       Eliminar canto
       =========================== */
    const confirmDeleteSong = () => {
        if (!songToDelete) return;

        const updated = songs.filter((s) => s.id !== songToDelete.id);
        localStorage.setItem(AUTOSAVE_LIBRARY, JSON.stringify(updated));
        setSongs(updated);
        setSongToDelete(null);
    };

    /* ===========================
       UI
       =========================== */
    return (
        <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            {/* Header */}
            <div style={{
                background: "white",
                padding: "16px 24px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                gap: 16
            }}>
                <button onClick={() => navigate("/")}>⬅ Voltar</button>
                <h1 style={{ margin: 0 }}>Editor de Cantos</h1>
            </div>

            <div style={{ padding: 24 }}>
                {/* Ações */}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <label style={{ cursor: "pointer" }}>
                        📥 Importar Word
                        <input
                            type="file"
                            accept=".docx"
                            hidden
                            onChange={(e) => handleImportWord(e.target.files[0])}
                        />
                    </label>

                    <button onClick={unifyRepeatedSongs}>🧹 Unificar</button>
                    <button onClick={normalizeLibrary}>🧼 Normalizar</button>
                </div>

                {/* Busca */}
                <input
                    type="text"
                    placeholder="🔍 Buscar por número, título, categoria ou tom"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", padding: 10, marginBottom: 12 }}
                />

                {/* Cabeçalho */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 180px 120px 60px",
                    background: "#eaeaea",
                    padding: 10,
                    fontWeight: 600
                }}>
                    <div onClick={() => toggleSort("numero")}>Nº{sortIcon("numero")}</div>
                    <div onClick={() => toggleSort("nome")}>Título{sortIcon("nome")}</div>
                    <div onClick={() => toggleSort("composer")}>Compositor{sortIcon("composer")}</div>
                    <div onClick={() => toggleSort("tonality")}>Tom{sortIcon("tonality")}</div>
                    <div>Ações</div>
                </div>

                {/* Lista */}
                <div style={{ background: "white", maxHeight: "70vh", overflowY: "auto" }}>
                    {sortedSongs.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "80px 1fr 180px 120px 60px",
                                padding: 10,
                                borderBottom: "1px solid #eee",
                                alignItems: "center"
                            }}
                        >
                            <div onClick={() => setSelectedSong(s)} style={{ cursor: "pointer" }}>
                                {s.numero || "—"}
                            </div>
                            <div onClick={() => setSelectedSong(s)} style={{ cursor: "pointer" }}>
                                {s.nome}
                            </div>
                            <div onClick={() => setSelectedSong(s)} style={{ cursor: "pointer" }}>
                                {s.composer || "—"}
                            </div>
                            <div onClick={() => setSelectedSong(s)} style={{ cursor: "pointer" }}>
                                {s.tonality || "—"}
                            </div>

                            {/* 🗑️ Eliminar */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSongToDelete(s);
                                }}
                                title="Eliminar canto"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 18
                                }}
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal editar */}
            {selectedSong && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{ background: "white", padding: 24, borderRadius: 8, width: 420 }}>
                        <h3>{selectedSong.numero} — {selectedSong.nome}</h3>
                        <p>Como deseja editar este canto?</p>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                style={{ flex: 1 }}
                                onClick={() =>
                                    navigate(`/editor-cantos/${selectedSong.id}?mode=projection`)
                                }
                            >
                                🎥 Projeção
                            </button>
                            <button
                                style={{ flex: 1 }}
                                onClick={() =>
                                    navigate(`/editor-cantos/${selectedSong.id}?mode=music`)
                                }
                            >
                                🎵 Cifras
                            </button>
                        </div>

                        <div style={{ marginTop: 16, textAlign: "right" }}>
                            <button onClick={() => setSelectedSong(null)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmar eliminação */}
            {songToDelete && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{ background: "white", padding: 24, borderRadius: 8, width: 420 }}>
                        <h3>Eliminar canto</h3>
                        <p>
                            Tem certeza que deseja eliminar o canto?
                            <br /><br />
                            <strong>{songToDelete.numero} — {songToDelete.nome}</strong>
                        </p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button onClick={() => setSongToDelete(null)}>Não</button>
                            <button
                                onClick={confirmDeleteSong}
                                style={{ background: "#c0392b", color: "white" }}
                            >
                                Sim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
