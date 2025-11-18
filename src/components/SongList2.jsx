// components/SongList.jsx
import React from "react";

function SongList({ selectedSongs, sections }) {
    return (
        <div className="space-y-2">
            {sections.map((section) => {
                const song = selectedSongs[section];
                if (!song) return null; // ignora se não tiver canto selecionado

                return (
                    <div
                        key={section}
                        className="p-2 border rounded bg-gray-50 flex justify-between items-center"
                    >
                        <div>
                            <strong>{section}:</strong>{" "}
                            {song.numero ? `[${song.numero}] ` : ""}
                            {song.nome}
                        </div>
                    </div>
                );
            })}
            {/* Caso não haja nenhum canto selecionado */}
            {Object.keys(selectedSongs).length === 0 && (
                <div className="text-gray-500 italic">Nenhum canto selecionado.</div>
            )}
        </div>
    );
}

export default SongList;
