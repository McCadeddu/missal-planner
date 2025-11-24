import React, { useState, useEffect } from "react";

/**
 * SongSelector – seletor litúrgico de cantos
 */
export default function SongSelector({
    section,
    songs = [],
    selectedSong,
    onSelect,
    allowClear = false,
}) {
    const [filter, setFilter] = useState("");
    const [searchByNumber, setSearchByNumber] = useState(false);
    const [filteredSongs, setFilteredSongs] = useState([]);

    useEffect(() => {
        const q = filter.toLowerCase();
        const res = songs.filter((s) => {
            const nome = (s.nome ?? "").toLowerCase();
            const numero = String(s.numero ?? "").toLowerCase();
            return searchByNumber ? numero.includes(q) : nome.includes(q);
        });
        setFilteredSongs(res);
    }, [filter, searchByNumber, songs]);

    return (
        <div className="cmv-window cmv-border" style={{ marginBottom: "1.6rem" }}>
            <strong
                className="h-liturgico"
                style={{
                    display: "block",
                    marginBottom: "1rem",
                    fontSize: "1.3rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                }}
            >
                {section}
            </strong>

            <div
                style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                    alignItems: "center",
                }}
            >
                <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder={`Buscar por ${searchByNumber ? "número" : "nome"}`}
                    className="cmv-input"
                    style={{ flex: 1 }}
                />

                <button
                    onClick={() => setSearchByNumber((prev) => !prev)}
                    className="btn-cmv"
                    style={{ padding: "0.55rem 0.75rem" }}
                >
                    {searchByNumber ? "Nome" : "Número"}
                </button>

                {allowClear && selectedSong && (
                    <button
                        onClick={() => onSelect(null)}
                        className="btn-cmv"
                        style={{ padding: "0.55rem 0.75rem" }}
                    >
                        Limpar
                    </button>
                )}
            </div>

            <select
                className="cmv-input"
                style={{ width: "100%" }}
                value={selectedSong ? selectedSong.numero : ""}
                onChange={(e) => {
                    const song = songs.find(
                        (s) => String(s.numero) === String(e.target.value)
                    );
                    onSelect(song);
                }}
            >
                <option value="">-- Selecionar --</option>
                {filteredSongs.map((s) => (
                    <option key={s.id} value={s.numero}>
                        {s.numero} — {s.nome}
                    </option>
                ))}
            </select>
        </div>
    );
}
