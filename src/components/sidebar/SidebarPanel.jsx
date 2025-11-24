import React from "react";
import Tooltip from "../Tooltip";

/**
 * SidebarPanel - exibe modo, seções, categorias e ações rápidas
 */
export default function SidebarPanel({
  mode, setMode, modes,
  sections, categoriesList,
  setFilterCategory, setSelectedSongs
}) {
  return (
    <div>
      <div className="p-4 rounded-xl shadow-md cmv-border" style={{ background: "white" }}>
        <Tooltip text="Escolher modo litúrgico para a missa">
          <h4 className="font-semibold mb-2" style={{ color: "var(--cmv-text)" }}>Modo / Seções</h4>
        </Tooltip>

        <div className="flex gap-2 mb-3">
          <Tooltip text="Escolha o modo (Missa, Adoração...)">
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="p-2 rounded" style={{ border: "1px solid var(--cmv-primary)", background: "white", color: "var(--cmv-text)" }}>
              {Object.keys(modes).map((m) => (
                <option key={m} value={m}>{modes[m].label}</option>
              ))}
            </select>
          </Tooltip>

          <Tooltip text="Limpar todas as seções escolhidas">
            <button onClick={() => setSelectedSongs({})} className="px-3 py-2 rounded btn-cmv-outline">Limpar seleções</button>
          </Tooltip>
        </div>

        <Tooltip text="Seções previstas no modo atual">
          <h5 className="font-semibold mb-2" style={{ color: "var(--cmv-text)" }}>Seções ativas</h5>
        </Tooltip>

        <div className="space-y-1">
          {sections.map((s) => <div key={s} style={{ color: "var(--cmv-muted)" }}>• {s}</div>)}
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl shadow-md cmv-border" style={{ background: "white" }}>
        <Tooltip text="Categorias dos cantos na biblioteca">
          <h5 className="font-semibold mb-2" style={{ color: "var(--cmv-text)" }}>Categorias</h5>
        </Tooltip>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((c) => (
            <button key={c} onClick={() => setFilterCategory(c === "Geral" ? "Todas" : c)} className="px-2 py-1 rounded text-sm cmv-border btn-cmv-outline">
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
