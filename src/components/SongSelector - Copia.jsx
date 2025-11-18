import React, { useState } from "react";

function SongSelector({ section, songs, selectedSong, onSelect }) {
    const [query, setQuery] = useState("");

    // Filtrar cantos pelo que foi digitado
    const filteredSongs = songs.filter(song => {
        const nameMatch = song.nome?.toLowerCase().includes(query.toLowerCase());
        const numberMatch = song.numero?.toString().includes(query);
        return nameMatch || numberMatch;
    });

    return (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            {/* Nome da seção */}
            <h3 className="font-semibold mb-2">{section}</h3>

            {/* Campo de busca */}
            <input
                type="text"
                placeholder="Buscar canto por nome ou número..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-2 mb-3 border rounded"
            />

            {/* Lista de cantos filtrados */}
            <div className="max-h-40 overflow-y-auto border rounded bg-white">
                {filteredSongs.length === 0 ? (
                    <p className="p-2 text-gray-500 italic">Nenhum canto encontrado.</p>
                ) : (
                    filteredSongs.map(song => (
                        <div
                            key={`${song.nome}-${song.numero}`}
                            className={`p-2 cursor-pointer hover:bg-indigo-100 transition ${selectedSong?.nome === song.nome ? "bg-indigo-200" : ""
                                }`}
                            onClick={() => onSelect(song)}
                        >
                            {song.nome} (nº {song.numero})
                        </div>
                    ))
                )}
            </div>

            {/* Mostrar canto selecionado */}
            {selectedSong && (
                <p className="mt-2 text-sm text-green-700 font-medium">
                    Selecionado: {selectedSong.nome} (nº {selectedSong.numero})
                </p>
            )}
        </div>
    );
}

export default SongSelector;
