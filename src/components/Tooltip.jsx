import React, { useState } from "react";

/**
 * Tooltip funcional CMV
 * - mostra dica no hover
 * - funciona no touch
 * - usa .tooltip-cmv do theme.css
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
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50"
                    style={{ pointerEvents: "none", transform: "translateX(-50%)" }}
                >
                    <div className="tooltip-cmv">
                        {text}
                    </div>
                </div>
            )}
        </div>
    );
}
