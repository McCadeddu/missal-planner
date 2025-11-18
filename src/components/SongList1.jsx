import React from "react";

function SongList({ selectedSongs, sections }) {
    // Filtrar só os momentos com canto selecionado
    const filteredSections = sections.filter(section => selectedSongs[section]);

    return (
        <div>
            {filteredSections.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum canto selecionado ainda.</p>
            ) : (
                <ul className="space-y-2">
                    {filteredSections.map(section => (
                        <li key={section} className="p-3 border rounded-lg bg-gray-50">
                            <strong>{section}:</strong>{" "}
                            {selectedSongs[section].nome} (nº {selectedSongs[section].numero})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SongList;
