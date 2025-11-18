import React, { useState, useEffect } from "react";

function SongSelector({ section, songs, selectedSong, onSelect, allowClear }) {
    const [filter, setFilter] = useState("");
    const [searchByNumber, setSearchByNumber] = useState(false);
    const [filteredSongs, setFilteredSongs] = useState([]);

    // Atualiza a lista filtrada
    useEffect(() => {
        const lowerFilter = filter.toLowerCase();
        const result = songs.filter(song => {
            if (searchByNumber) {
                return song.numero.toLowerCase().includes(lowerFilter);
            } else {
                return song.nome.toLowerCase().includes(lowerFilter);
            }
        });
        setFilteredSongs(result);
    }, [filter, searchByNumber, songs]);

    return (
        <div className="mb-4 p-2 border rounded bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <strong>{section}</strong>
                {allowClear && selectedSong && (
                    <button
                        onClick={() => onSelect(null)}
                        className="text-red-600 hover:underline text-sm"
                    >
                        Limpar
                    </button>
                )}
            </div>

            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    placeholder={`Buscar por ${searchByNumber ? "número" : "nome"}`}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="p-1 border rounded flex-1"
                />
                <button
                    onClick={() => setSearchByNumber(prev => !prev)}
                    className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {searchByNumber ? "Nome" : "Número"}
                </button>
            </div>

            <select
                value={selectedSong ? selectedSong.numero : ""}
                onChange={(e) => {
                    const song = songs.find(s => s.numero === e.target.value);
                    onSelect(song);
                }}
                className="w-full p-1 border rounded"
            >
                <option value="">-- Selecionar --</option>
                {filteredSongs.map(song => (
                    <option key={song.numero} value={song.numero}>
                        {song.numero} - {song.nome}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default SongSelector;
