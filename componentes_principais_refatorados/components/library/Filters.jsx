import React from "react";
import Tooltip from "../../Tooltip";

/**
 * Filters - inputs de busca e filtros
 */
export default function Filters({
  globalSearch, setGlobalSearch,
  filterCategory, setFilterCategory,
  filterComposer, setFilterComposer,
  sortMode, setSortMode,
  categoriesList
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 items-center">
      <Tooltip text="Pesquisar na biblioteca de cantos">
        <input
          placeholder="Pesquisar..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="p-2 rounded flex-1 min-w-[180px]"
          style={{ border: "1px solid var(--cmv-primary)", background: "white", color: "var(--cmv-text)" }}
        />
      </Tooltip>

      <Tooltip text="Filtrar por categoria">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 rounded"
          style={{ border: "1px solid var(--cmv-primary)", background: "white", color: "var(--cmv-text)" }}
        >
          <option>Todas</option>
          {categoriesList.map((c) => (<option key={c}>{c}</option>))}
        </select>
      </Tooltip>

      <Tooltip text="Filtrar por compositor">
        <input
          placeholder="Compositor"
          value={filterComposer}
          onChange={(e) => setFilterComposer(e.target.value)}
          className="p-2 rounded min-w-[160px]"
          style={{ border: "1px solid var(--cmv-primary)", background: "white", color: "var(--cmv-text)" }}
        />
      </Tooltip>

      <Tooltip text="Ordenar biblioteca">
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          className="p-2 rounded"
          style={{ border: "1px solid var(--cmv-primary)", background: "white", color: "var(--cmv-text)" }}
        >
          <option value="added">Ordem de adição</option>
          <option value="nome">Nome</option>
          <option value="numero">Número</option>
        </select>
      </Tooltip>
    </div>
  );
}
