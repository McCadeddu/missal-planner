import React, { useState } from "react";

/**
 * Tooltip.jsx
 * Comportamento: mostra texto ao passar o mouse / tocar.
 * OBS: o estilo visual deve estar em theme.css (classe .tooltip-cmv).
 */
export default function Tooltip({ children, text }) {
    const [visible, setVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onTouchStart={() => setVisible((v) => !v)}
        >
            {children}

            {visible && (
                <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 tooltip-cmv animate-fade z-50"
                    role="tooltip"
                    aria-hidden={!visible}
                >
                    {text}
                </div>
            )}
        </div>
    );
}
