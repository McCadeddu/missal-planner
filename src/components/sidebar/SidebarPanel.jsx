import React from "react";

/**
 * SidebarPanel
 * - Exibe modo, seções ativas e ações rápidas
 * - ⚠️ Categorias removidas (já existem no filtro principal)
 */
export default function SidebarPanel({
    mode,
    setMode,
    modes,
    sections,
    setSelectedSongs
}) {
    return (
        <div>
            {/* ===========================
                     MODO + AÇÕES
                =========================== */}
            <div
                className="p-4 rounded-xl shadow-md cmv-border"
                style={{ background: "white" }}
            >
                <div className="flex gap-2 mb-3">
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="p-2 rounded"
                        style={{
                            border: "1px solid var(--cmv-primary)",
                            background: "white",
                            color: "var(--cmv-text)"
                        }}
                    >
                        {Object.keys(modes).map((m) => (
                            <option key={m} value={m}>
                                {modes[m].label}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setSelectedSongs({})}
                        className="px-3 py-2 rounded btn-cmv-outline"
                    >
                        Limpar seleções
                    </button>
                </div>

                <h5
                    className="font-semibold mb-2"
                    style={{ color: "var(--cmv-text)" }}
                >
                    Seções ativas
                </h5>

                <div className="space-y-1">
                    {sections.map((s) => (
                        <div key={s} style={{ color: "var(--cmv-muted)" }}>
                            • {s}
                        </div>
                    ))}
                </div>
            </div>

            {/* ===========================
                        MÓDULOS
                =========================== */}
            <div
                className="mt-4 p-4 rounded-xl shadow-md cmv-border"
                style={{ background: "white" }}
            >
                <h5
                    className="font-semibold mb-2"
                    style={{ color: "var(--cmv-text)" }}
                >
                    Módulos
                </h5>

                <a
                    href="#/editor-cantos"
                    className="block w-full text-center px-3 py-2 rounded btn-cmv-outline"
                >
                    🎵 Editor de Cantos
                </a>
            </div>
        </div>
    );
}
