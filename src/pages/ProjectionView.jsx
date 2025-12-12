// ProjectionView.jsx
import React, { useEffect, useRef, useState } from "react";

/*
 ProjectionView.jsx - versão final (P1 + T2 + H1)
 - A projeção sempre começa no topo absoluto da tela com margem fixa (15px).
 - O conteúdo projetado é apenas o texto enviado no payload (payload.text).
 - Não usamos paddingTop derivado de viewportTop; a posição interna da moldura na A4 é ignorada.
 - Mantemos fontScale (zoom) via transform: scale(...) para espelhar o operador.
 - Não há seleção de texto (user-select: none).
 - Comportamento H1: se houver poucas linhas, o resto da tela fica preto.
 - Integração esperada com APIs expostas pelo preload:
     window.missalAPI.onLiveUpdate(callback)
     window.missalAPI.onProjectionOverlayToggle(callback)
*/

export default function ProjectionView() {
    const PROJECTION_TOP_MARGIN_PX = 15; // margem fixa visual (px)

    const [text, setText] = useState("");
    const [fontScale, setFontScale] = useState(1.0);
    const [viewportHeight, setViewportHeight] = useState(null); // não usado para posicionamento, mantido para info
    const [isLive, setIsLive] = useState(false);
    const [overlayVisible, setOverlayVisible] = useState(true);
    const [pageIndex, setPageIndex] = useState(0);

    const containerRef = useRef(null);
    const scaledRef = useRef(null);

    // Recebe atualizações ao vivo do operador
    useEffect(() => {
        if (!window.missalAPI?.onLiveUpdate) return;

        const unsub = window.missalAPI.onLiveUpdate((payload) => {
            // payload expected: { text, live, fontScale, viewportTop, viewportHeight, pageIndex }
            const liveFlag = !!payload?.live;
            setIsLive(liveFlag);

            // Quando não estiver em live, limpamos o texto
            setText(liveFlag ? (payload?.text ?? "") : "");
            if (payload?.fontScale !== undefined) setFontScale(payload.fontScale);
            if (payload?.viewportHeight !== undefined) setViewportHeight(payload.viewportHeight);
            if (payload?.pageIndex !== undefined) setPageIndex(payload.pageIndex);

            // garantir que a viewport de projeção "role" para o topo visual (limpar scroll)
            requestAnimationFrame(() => {
                try {
                    if (containerRef.current) containerRef.current.scrollTop = 0;
                } catch (e) { /* ignore */ }
            });
        });

        return unsub;
    }, []);

    // Toggle da moldura (overlay) — caso use essa API
    useEffect(() => {
        if (!window.missalAPI?.onProjectionOverlayToggle) return;
        const unsub = window.missalAPI.onProjectionOverlayToggle(() => setOverlayVisible(v => !v));
        return unsub;
    }, []);

    // Normalizar fontScale em limites razoáveis para evitar quebras visuais
    const safeScale = Math.max(0.4, Math.min(3.5, Number(fontScale) || 1.0));

    // Estrutura:
    // - containerRef: tela inteira do projetor (preto)
    // - wrapper: aplica a margem fixa de 15px (não é afetada pelo scale)
    // - scaled: aplica transform: scale(safeScale) e contém o texto
    return (
        <div
            ref={containerRef}
            style={{
                height: "100vh",
                width: "100vw",
                background: "black",
                color: "white",
                overflow: "hidden",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: 0,
                // borda visível opcional (quando overlay ligado)
                border: overlayVisible ? "6px solid rgba(0,183,255,0.4)" : "none",
                transition: "border 180ms ease",
                // impedir seleção de texto
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none"
            }}
        >
            {/* Wrapper com margem fixa (visual) — não é afetado pelo scale */}
            <div
                style={{
                    width: "100%",
                    maxWidth: 1100,
                    paddingTop: `${PROJECTION_TOP_MARGIN_PX}px`,
                    paddingLeft: 40,
                    paddingRight: 40,
                    boxSizing: "border-box",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}
            >
                {/* Elemento escalado que contém o texto; transformOrigin top-center mantém o início no topo */}
                <div
                    ref={scaledRef}
                    style={{
                        width: "100%",
                        transform: `scale(${safeScale})`,
                        transformOrigin: "center top",
                        textAlign: "center",
                        whiteSpace: "pre-wrap",
                        fontSize: "2.4rem", // base; operador varia via fontScale
                        lineHeight: 1.4,
                        boxSizing: "border-box",
                        // garantir que nem o scaled nem seu conteúdo possam ser selecionados
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        color: "#ffffff"
                    }}
                >
                    {/* Mostrar somente quando em live; caso contrário nada */}
                    {isLive ? text : ""}
                </div>
            </div>
        </div>
    );
}
