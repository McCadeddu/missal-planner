import React from "react";
import LibraryItem from "./LibraryItem";

/**
 * LibraryPanel - lista a biblioteca filtrada
 */
export default function LibraryPanel({ songs, onAdd, onEdit }) {
  return (
    <div>
      <h4 className="font-semibold mb-2" style={{ color: "var(--cmv-text)" }}>
        Biblioteca ({songs.length})
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {songs.map((s) => (
          <LibraryItem key={s.id} song={s} onAdd={onAdd} onEdit={onEdit} />
        ))}
        {songs.length === 0 && <div className="text-sm" style={{ color: "var(--cmv-muted)" }}>Nenhum canto encontrado.</div>}
      </div>
    </div>
  );
}
