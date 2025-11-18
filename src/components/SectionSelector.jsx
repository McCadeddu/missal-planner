import React, { useState, useEffect } from "react";

export default function SongSelector({ sectionId, songs, onSelect }) {
    const [search, setSearch] = useState("");
    const [filteredSongs, setFilteredSongs] = useState([]);

    // Filtra os cantos com base na pesquisa
    useEffect(() => {
        const result = songs.filter(
            (song) =>
                song.nome.toLowerCase().includes(search.toLowerCase()) ||
                song.numero.toString().includes(search)
        );
        setFilteredSongs(result);
    }, [search, songs]);

    return (
        <div className="p-4 bg-white shadow rounded-xl mb-4">
            <h2 className="text-xl font-bold mb-3">
                Escolher Canto para: {sectionId}
            </h2>

            <input
                type="text"
                placeholder="Buscar pelo nome ou número..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 border rounded mb-3"
            />

            <div className="max-h-60 overflow-y-auto border rounded p-2 bg-gray-50">
                {filteredSongs.map((song) => (
                    <div
                        key={song.numero}
                        className="p-2 hover:bg-gray-200 rounded cursor-pointer"
                        onClick={() => onSelect(sectionId, song)}
                    >
                        <strong>{song.numero}</strong> — {song.nome}
                    </div>
                ))}
            </div>
        </div>
    );
}
