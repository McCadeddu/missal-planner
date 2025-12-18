import React from "react";

/**
 * LibraryItem - mostra um canto resumido e ações (Add / Edit)
 */
export default function LibraryItem({ song, onAdd, onEdit }) {
    return (
        <div
            className="p-2 rounded flex items-center justify-between cmv-border"
            style={{ background: "white" }}
        >
            <div>
                <div
                    className="font-medium"
                    style={{ color: "var(--cmv-text, #222)" }}
                >
                    {song.nome}
                </div>

                <div
                    className="text-sm"
                    style={{ color: "var(--cmv-muted, #555)" }}
                >
                    {song.numero} {song.composer ? "— " + song.composer : ""}{" "}
                    {song.category ? "• " + song.category : ""}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => onAdd(song)} className="px-2 py-1 rounded text-sm btn-cmv-outline">
                    Add
                </button>
                <button onClick={() => onEdit(song)} className="px-2 py-1 rounded text-sm btn-cmv-outline">
                    Editar
                </button>
            </div>
        </div>
    );
}
