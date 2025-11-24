import React from "react";
import SongList from "../SongList";

/**
 * SelectedSongsPanel - wrapper for SongList
 */
export default function SelectedSongsPanel({ selectedSongs, sections, onRemove, onEdit }) {
  const list = [];
  for (const sec of sections) {
    const arr = selectedSongs[sec];
    if (!arr || arr.length === 0) continue;
    for (let i = 0; i < arr.length; i++) list.push({ ...arr[i], section: sec, indexInSection: i });
  }

  return (
    <div>
      <SongList title={`Missa — ${list.length} itens`} list={list} onRemove={onRemove} onEdit={onEdit} />
    </div>
  );
}
