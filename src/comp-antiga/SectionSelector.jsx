import React from "react";

export default function SectionSelector({ sections = [], onSelect }) {
    return (
        <div className="cmv-window cmv-border" style={{ marginBottom: "1.4rem" }}>
            <h2 className="h-liturgico" style={{
                fontSize: "1.25rem",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
            }}>Seções</h2>
            <ul className="space-y-2">
                {sections.map((sec) => (
                    <li
                        key={sec}
                        className="p-2 rounded cursor-pointer"
                        style={{
                            background: "linear-gradient(180deg, #fff, #fbfaf5)",
                            border: "1px solid rgba(0,0,0,0.03)"
                        }}
                        onClick={() => onSelect(sec)}
                    >
                        <div style={{ color: "var(--cmv-text)" }}>{sec}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
