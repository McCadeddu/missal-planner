import React from "react";

/**
 * SongList – Lista litúrgica de cantos selecionados
 * Usada pelo painel SelectedSongsPanel.jsx
 */
export default function SongList({ title, list = [], onRemove, onEdit }) {
    return (
        <div
            className="cmv-window cmv-border"
            style={{ marginBottom: "1.6rem" }}
        >
            {title && (
                <h3
                    className="h-liturgico"
                    style={{
                        marginBottom: "1rem",
                        fontSize: "1.35rem",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                    }}
                >
                    {title}
                </h3>
            )}

            {list.length === 0 ? (
                <p
                    className="p-muted"
                    style={{
                        fontSize: "1rem",
                        padding: "0.5rem 0",
                        textAlign: "center",
                    }}
                >
                    Nenhum canto selecionado ainda.
                </p>
            ) : (
                <div className="space-y-4">
                    {list.map((item, idx) => (
                        <div
                            key={`${item.section}-${idx}`}
                            className="cmv-border"
                            style={{
                                background: "white",
                                padding: "1.2rem",
                                borderRadius: "16px",
                                boxShadow: "0 10px 22px rgba(92,46,9,0.05)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "1rem",
                            }}
                        >
                            <div style={{ flexGrow: 1 }}>
                                <div
                                    style={{
                                        color: "var(--cmv-text)",
                                        fontSize: "1.05rem",
                                        fontWeight: 600,
                                        marginBottom: "0.35rem",
                                    }}
                                >
                                    {item.numero ? `${item.numero} — ` : ""}
                                    {item.nome}
                                </div>

                                <div
                                    className="p-muted"
                                    style={{
                                        fontSize: "0.82rem",
                                        marginBottom: "0.35rem",
                                    }}
                                >
                                    {item.composer ? `${item.composer} • ` : ""}
                                    {item.category || ""}
                                </div>

                                <div
                                    className="p-muted"
                                    style={{
                                        fontSize: "0.78rem",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {item.section}
                                </div>
                            </div>

                            <div className="flex" style={{ gap: "0.6rem" }}>
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit({ section: item.section, indexInSection: item.indexInSection })}
                                        className="btn-cmv"
                                        style={{ padding: "0.5rem 0.65rem" }}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                )}

                                {onRemove && (
                                    <button
                                        onClick={() => onRemove({ section: item.section, indexInSection: item.indexInSection })}
                                        className="btn-cmv"
                                        style={{
                                            padding: "0.5rem 0.65rem",
                                            background: "var(--cmv-accent)",
                                            borderColor: "var(--cmv-accent)",
                                            color: "white",
                                        }}
                                        title="Remover"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
