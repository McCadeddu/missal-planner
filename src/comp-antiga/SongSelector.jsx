import React, { useState, useEffect } from "react";

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
        const lower = filter.toLowerCase();
        const res = songs.filter((s) => {
            const nome = (s.nome ?? "").toLowerCase();
            const numero = String(s.numero ?? "").toLowerCase();
            return searchByNumber ? numero.includes(lower) : nome.includes(lower);
        });
        setFilteredSongs(res);
    }, [filter, searchByNumber, songs]);

    return (
        <div
            className="cmv-window cmv-border"
            style={{
                marginBottom: "1.6rem",
                padding: "1.4rem",
                borderRadius: "18px",
                boxShadow: "0 10px 26px rgba(92,46,9,0.06)",
            }}
        >
            {/* Título da seção */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                }}
            >
                <strong
                    className="h-liturgico"
                    style={{
                        fontSize: "1.35rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "var(--cmv-text)",
                    }}
                >
                    {section}
                </strong>

                {allowClear && selectedSong && (
                    <button
                        onClick={() => onSelect(null)}
                        className="btn-cmv"
                        style={{
                            padding: "0.45rem 0.7rem",
                            fontSize: "0.85rem",
                        }}
                    >
                        Limpar
                    </button>
                )}
            </div>

            {/* Barra de busca */}
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
                    style={{
                        flex: 1,
                        fontSize: "0.95rem",
                    }}
                />

                <button
                    onClick={() => setSearchByNumber((prev) => !prev)}
                    className="btn-cmv"
                    style={{
                        padding: "0.55rem 0.75rem",
                        fontSize: "0.85rem",
                        whiteSpace: "nowrap",
                    }}
                >
                    {searchByNumber ? "Nome" : "Número"}
                </button>
            </div>

            {/* Selector final */}
            <select
                value={selectedSong ? selectedSong.numero : ""}
                onChange={(e) => {
                    const song = songs.find(
                        (s) => String(s.numero) === String(e.target.value)
                    );
                    onSelect(song);
                }}
                className="cmv-input"
                style={{
                    width: "100%",
                    fontSize: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                }}
            >
                <option value="">-- Selecionar --</option>

                {filteredSongs.map((s) => (
                    <option
                        key={s.id ?? `${s.numero}-${s.nome}`}
                        value={s.numero}
                    >
                        {s.numero} - {s.nome}
                    </option>
                ))}
            </select>
        </div>
    );
}
