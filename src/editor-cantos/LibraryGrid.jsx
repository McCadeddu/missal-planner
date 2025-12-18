import React, { useState } from "react";

export default function LibraryGrid({ songs, onOpen }) {
    const [sort, setSort] = useState({ key: "numero", dir: "asc" });

    const sorted = [...songs].sort((a, b) => {
        const A = (a[sort.key] || "").toString().toLowerCase();
        const B = (b[sort.key] || "").toString().toLowerCase();

        if (A < B) return sort.dir === "asc" ? -1 : 1;
        if (A > B) return sort.dir === "asc" ? 1 : -1;
        return 0;
    });

    const toggleSort = (key) => {
        setSort((prev) => ({
            key,
            dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc"
        }));
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 180px 120px",
                fontWeight: "bold",
                borderBottom: "2px solid #ccc",
                padding: "8px 6px"
            }}>
                <span onClick={() => toggleSort("numero")}>Nº</span>
                <span onClick={() => toggleSort("nome")}>Título</span>
                <span onClick={() => toggleSort("category")}>Categoria</span>
                <span onClick={() => toggleSort("tonality")}>Tonalidade</span>
            </div>

            {/* Rows */}
            {sorted.map((s) => (
                <div
                    key={s.id}
                    onClick={() => onOpen(s.id)}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "80px 1fr 180px 120px",
                        padding: "6px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                        background: "#fff"
                    }}
                >
                    <span>{s.numero || "—"}</span>
                    <span>{s.nome}</span>
                    <span>{s.category || "—"}</span>
                    <span>{s.tonality || "—"}</span>
                </div>
            ))}
        </div>
    );
}
