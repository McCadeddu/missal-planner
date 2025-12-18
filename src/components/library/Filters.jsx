import { useRef, useEffect } from "react";
import React from "react";

/**
 * Filters.jsx — componente simples de filtros.
 * Recebe:
 *  - globalSearch, setGlobalSearch
 *  - filterCategory, setFilterCategory
 *  - filterComposer, setFilterComposer
 *  - sortMode, setSortMode
 *  - categoriesList
 */

export default function Filters({
    globalSearch,
    setGlobalSearch,
    filterCategory,
    setFilterCategory,
    filterComposer,
    setFilterComposer,
    sortMode,
    setSortMode,
    categoriesList,
    searchInputRef // ⬅️ NOVO
}) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px]">
          <label className="text-sm block mb-1" style={{ color: "var(--cmv-muted)" }}>Todas as categorias</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 rounded">
            {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[220px]">
          <label className="text-sm block mb-1" style={{ color: "var(--cmv-muted)" }}>Pesquisar</label>
                  <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Pesquisar (nome, número, letra...)"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full p-4 text-lg rounded-xl shadow-md focus:outline-none focus:ring-4"
                      style={{
                          border: "1px solid var(--cmv-primary)",
                          backgroundColor: "#fff",
                          color: "#222",
                          fontWeight: "600",
                          boxShadow: "0 0 0 3px rgba(0,68,170,0.15)",
                      }}
                  />
        </div>

        <div style={{ minWidth: 220 }}>
          <label className="text-sm block mb-1" style={{ color: "var(--cmv-muted)" }}>Ordem de edição</label>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="p-2 rounded w-full">
            <option value="added">Ordem de edição</option>
            <option value="nome">Nome (A→Z)</option>
            <option value="numero">Número</option>
          </select>
        </div>
      </div>
    </div>
  );
}
