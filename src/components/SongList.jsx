import React from "react";

export default function SongList({ selectedSongs, sections }) {
    // Filtra apenas os momentos que têm canto selecionado
    const filteredSections = sections.filter(
        (section) => selectedSongs[section] && selectedSongs[section].nome
    );

    if (filteredSections.length === 0) {
        return <p>Nenhum canto selecionado ainda.</p>;
    }

    return (
        <div className="space-y-2">
            {filteredSections.map((section) => (
                <div key={section} className="p-2 border rounded flex justify-between items-center bg-gray-50">
                    <span className="font-medium">{section}</span>
                    <span>
                        {selectedSongs[section].numero} - {selectedSongs[section].nome}
                    </span>
                </div>
            ))}
        </div>
    );
}
