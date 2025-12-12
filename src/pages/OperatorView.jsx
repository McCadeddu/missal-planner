// OperatorView.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";

/*
 OperatorView.jsx — Versão consolidada
 - Restaura 4 colunas (lista / anterior / atual / seguinte)
 - Janelinhas de prévia anterior/atual/seguinte (mini-frames editáveis)
 - Moldura azul por página guardada em framesPerPage
 - Drag vertical + resize (apenas margem inferior)
 - Paginação recalculada por zoom (fontScale)
 - Preview & Live (throttled via rAF)
 - Voltar ao início, navegação entre páginas
 - Controles de projeção: seleção de monitor, Abrir Projeção (Fullscreen), Mostrar borda / Fullscreen, Tela Cheia
 - Integra com window.missalAPI (mesmas APIs que você já expôs no preload)
*/

export default function OperatorView() {
    // --- estados principais
    const [songs, setSongs] = useState([]);
    const [selected, setSelected] = useState(null);
    const [previewText, setPreviewText] = useState("");

    // linhas / paginação
    const [lines, setLines] = useState([]);
    const [pages, setPages] = useState([[]]);
    const [pageIndex, setPageIndex] = useState(0);

    // viewport / moldura corrente (em px no container da página)
    const DEFAULT_VIEWPORT_HEIGHT = 220;
    const [viewportTop, setViewportTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);
    const [fontScale, setFontScale] = useState(1.0);
    const [isLive, setIsLive] = useState(false);

    // frames por página: { [pageIndex]: { top, height } }
    const [framesPerPage, setFramesPerPage] = useState({});

    // monitor / projeção
    const [displays, setDisplays] = useState([]);
    const [selectedDisplay, setSelectedDisplay] = useState(0);
    const [isProjectionFullscreen, setIsProjectionFullscreen] = useState(false);

    // refs
    const pageRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    // drag/resize refs (generalized for any page frame)
    const dragging = useRef({ active: false, page: null, startY: 0, startTop: 0 });
    const resizing = useRef({ active: false, page: null, startY: 0, startHeight: 0 });

    // rAF throttle
    const rafRef = useRef(null);
    const pendingLive = useRef(null);

    // metrics
    const baseLineHeightPx = 28;
    const minViewportHeight = 40;

    /* ===========================
       Load displays (M3)
       =========================== */
    useEffect(() => {
        let mounted = true;
        async function loadDisplays() {
            try {
                if (window.missalAPI?.getDisplays) {
                    const list = await window.missalAPI.getDisplays();
                    if (mounted && Array.isArray(list) && list.length > 0) {
                        setDisplays(list);
                        setSelectedDisplay((s) => (s < list.length ? s : 0));
                    }
                }
            } catch (err) {
                console.error("Erro getDisplays:", err);
            }
        }
        loadDisplays();
        return () => { mounted = false; };
    }, []);

    /* ===========================
       Paginação a partir de lines e fontScale
       - estratégia por linhas (estável e previsível)
       =========================== */
    const recalcPagination = useCallback(() => {
        const container = pageRef.current;
        const containerHeight = container ? container.clientHeight - 24 : 800;
        const effectiveLineHeight = Math.round(baseLineHeightPx * fontScale);
        const linesPerPage = Math.max(2, Math.floor(containerHeight / effectiveLineHeight));
        const newPages = [];
        for (let i = 0; i < lines.length; i += linesPerPage) {
            newPages.push(lines.slice(i, i + linesPerPage));
        }
        if (newPages.length === 0) newPages.push([]);
        setPages(newPages);

        // ensure frames exist for all pages
        setFramesPerPage((prev) => {
            const copy = { ...prev };
            for (let i = 0; i < newPages.length; i++) {
                if (!copy[i]) {
                    copy[i] = { top: 0, height: DEFAULT_VIEWPORT_HEIGHT };
                } else {
                    // clamp height to container
                    const maxH = Math.max(minViewportHeight, container ? container.clientHeight - copy[i].top : DEFAULT_VIEWPORT_HEIGHT);
                    copy[i] = { top: copy[i].top, height: Math.min(copy[i].height, maxH) };
                }
            }
            return copy;
        });

        // clamp pageIndex
        setPageIndex((pi) => Math.min(pi, newPages.length - 1));
    }, [lines, fontScale]);

    /* lines <- previewText */
    useEffect(() => {
        const split = previewText ? previewText.replace(/\r/g, "").split("\n") : [""];
        setLines(split);
    }, [previewText]);

    useEffect(() => {
        recalcPagination();
    }, [lines, fontScale, recalcPagination]);

    useEffect(() => {
        const obs = new ResizeObserver(() => recalcPagination());
        if (pageRef.current) obs.observe(pageRef.current);
        return () => obs.disconnect();
    }, [recalcPagination]);

    /* ===========================
       Preview + Live throttled (rAF)
       =========================== */
    const sendLiveThrottled = useCallback((payload) => {
        pendingLive.current = payload;
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            if (pendingLive.current && window.missalAPI?.sendLive) {
                window.missalAPI.sendLive(pendingLive.current);
            }
            pendingLive.current = null;
        });
    }, []);

    const updatePreview = useCallback(() => {
        const currentPage = pages[pageIndex] || [];
        if (!currentPage || currentPage.length === 0) {
            if (window.missalAPI?.setPreview) window.missalAPI.setPreview({ text: "", fontScale, viewportTop, viewportHeight, pageIndex });
            return;
        }

        const effectiveLineHeight = baseLineHeightPx * fontScale;
        const startLine = Math.floor(viewportTop / effectiveLineHeight);
        const endLine = Math.ceil((viewportTop + viewportHeight) / effectiveLineHeight);
        const visible = currentPage.slice(startLine, endLine).join("\n");

        if (window.missalAPI?.setPreview) {
            window.missalAPI.setPreview({
                text: visible,
                fontScale,
                viewportHeight,
                viewportTop,
                pageIndex
            });
        }
    }, [pages, pageIndex, fontScale, viewportTop, viewportHeight]);

    useEffect(() => {
        updatePreview();
        if (isLive) {
            const page = pages[pageIndex] || [];
            const lh = baseLineHeightPx * fontScale;
            const start = Math.floor(viewportTop / lh);
            const end = Math.ceil((viewportTop + viewportHeight) / lh);
            sendLiveThrottled({
                text: page.slice(start, end).join("\n"),
                live: true,
                fontScale,
                viewportTop,
                viewportHeight,
                pageIndex
            });
        }
    }, [viewportTop, viewportHeight, fontScale, pageIndex, pages, isLive, updatePreview, sendLiveThrottled]);

    /* ===========================
       Drag & Resize global handlers (support current + prev/next frames)
       - dragging.page indicates which page's frame is being manipulated
       =========================== */
    useEffect(() => {
        const onMove = (e) => {
            if (dragging.current.active) {
                const { page, startY, startTop } = dragging.current;
                // choose container ref
                const container = (page === pageIndex ? pageRef.current : (page === pageIndex - 1 ? prevRef.current : nextRef.current));
                if (!container) return;
                const dy = e.clientY - startY;
                const maxTop = Math.max(0, container.clientHeight - (framesPerPage[page]?.height || DEFAULT_VIEWPORT_HEIGHT));
                let nextTop = startTop + dy;
                nextTop = Math.max(0, Math.min(nextTop, maxTop));
                setFramesPerPage((prev) => ({ ...prev, [page]: { ...(prev[page] || { top: 0, height: DEFAULT_VIEWPORT_HEIGHT }), top: nextTop } }));
                if (page === pageIndex) setViewportTop(nextTop);
            } else if (resizing.current.active) {
                const { page, startY, startHeight } = resizing.current;
                const container = (page === pageIndex ? pageRef.current : (page === pageIndex - 1 ? prevRef.current : nextRef.current));
                if (!container) return;
                const dy = e.clientY - startY;
                const maxH = Math.max(minViewportHeight, container.clientHeight - (framesPerPage[page]?.top || 0));
                let nextH = Math.max(minViewportHeight, startHeight + dy);
                nextH = Math.min(nextH, maxH);
                setFramesPerPage((prev) => ({ ...prev, [page]: { ...(prev[page] || { top: 0, height: DEFAULT_VIEWPORT_HEIGHT }), height: nextH } }));
                if (page === pageIndex) setViewportHeight(nextH);
            }
        };

        const onUp = () => {
            if (dragging.current.active) {
                dragging.current.active = false;
                updatePreview();
                if (isLive) {
                    sendLiveThrottled({
                        text: (pages[pageIndex] || []).slice(
                            Math.floor(viewportTop / (baseLineHeightPx * fontScale)),
                            Math.ceil((viewportTop + viewportHeight) / (baseLineHeightPx * fontScale))
                        ).join("\n"),
                        live: true,
                        fontScale,
                        viewportHeight,
                        viewportTop,
                        pageIndex
                    });
                }
            }
            if (resizing.current.active) {
                resizing.current.active = false;
                updatePreview();
                if (isLive) {
                    sendLiveThrottled({
                        text: (pages[pageIndex] || []).slice(
                            Math.floor(viewportTop / (baseLineHeightPx * fontScale)),
                            Math.ceil((viewportTop + viewportHeight) / (baseLineHeightPx * fontScale))
                        ).join("\n"),
                        live: true,
                        fontScale,
                        viewportHeight,
                        viewportTop,
                        pageIndex
                    });
                }
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [framesPerPage, pageIndex, pages, isLive, viewportTop, viewportHeight, fontScale, updatePreview, sendLiveThrottled]);

    /* start drag for a specific page frame (0..n) */
    const startDragForPage = (e, targetPage) => {
        dragging.current = { active: true, page: targetPage, startY: e.clientY, startTop: framesPerPage[targetPage]?.top || 0 };
        e.preventDefault();
    };

    /* start resize for specific page frame (only bottom edge) */
    const startResizeForPage = (e, targetPage) => {
        resizing.current = { active: true, page: targetPage, startY: e.clientY, startHeight: framesPerPage[targetPage]?.height || DEFAULT_VIEWPORT_HEIGHT };
        e.preventDefault();
    };

    /* ---------------------------
       API integration: load song list
       --------------------------- */
    useEffect(() => {
        if (!window.missalAPI?.onLoadSongList) return;
        const unsub = window.missalAPI.onLoadSongList((list) => {
            setSongs(Array.isArray(list) ? list : []);
        });
        return unsub;
    }, []);

    /* openSong (carregar texto do canto) */
    const openSong = async (song) => {
        setSelected(song);
        let baseText = song?.fullText ?? (Array.isArray(song.textChunks) ? song.textChunks.join("\n") : "");
        if (window.missalAPI?.loadSongTextFromFile) {
            try {
                const file = await window.missalAPI.loadSongTextFromFile({ id: song.id, numero: song.numero, nome: song.nome });
                if (file?.ok) baseText = file.fullText;
            } catch { /* ignore */ }
        }
        setPreviewText(baseText);
        // reset to first page and default frame
        setPageIndex(0);
        setFramesPerPage((prev) => ({ ...prev, 0: { top: 0, height: DEFAULT_VIEWPORT_HEIGHT } }));
        setViewportTop(0);
        setViewportHeight(DEFAULT_VIEWPORT_HEIGHT);
        setFontScale(1.0);
    };

    /* goToPage: navigate and apply saved frame */
    const goToPage = (newIndex) => {
        const idx = Math.max(0, Math.min(newIndex, pages.length - 1));
        setPageIndex(idx);
        setFramesPerPage((prev) => {
            const cp = { ...prev };
            if (!cp[idx]) cp[idx] = { top: 0, height: DEFAULT_VIEWPORT_HEIGHT };
            return cp;
        });
        // apply frame after next tick to ensure framesPerPage updated
        setTimeout(() => {
            const f = framesPerPage[idx] || { top: 0, height: DEFAULT_VIEWPORT_HEIGHT };
            setViewportTop(f.top);
            setViewportHeight(f.height);
            updatePreview();
            if (isLive) {
                sendLiveThrottled({
                    text: (pages[idx] || []).slice(
                        Math.floor(f.top / (baseLineHeightPx * fontScale)),
                        Math.ceil((f.top + f.height) / (baseLineHeightPx * fontScale))
                    ).join("\n"),
                    live: true,
                    fontScale,
                    viewportHeight: f.height,
                    viewportTop: f.top,
                    pageIndex: idx
                });
            }
        }, 0);
    };

    /* voltarAoInicio (A2) */
    const voltarAoInicio = () => {
        setPageIndex(0);
        setFramesPerPage((prev) => ({ ...prev, 0: { top: 0, height: DEFAULT_VIEWPORT_HEIGHT } }));
        setViewportTop(0);
        setViewportHeight(DEFAULT_VIEWPORT_HEIGHT);
        updatePreview();
        if (isLive) {
            sendLiveThrottled({
                text: (pages[0] || []).slice(0, Math.ceil(DEFAULT_VIEWPORT_HEIGHT / (baseLineHeightPx * fontScale))).join("\n"),
                live: true,
                fontScale,
                viewportHeight: DEFAULT_VIEWPORT_HEIGHT,
                viewportTop: 0,
                pageIndex: 0
            });
        }
    };

    /* toggleLive */
    const toggleLive = () => {
        if (!isLive) {
            setIsLive(true);
            sendLiveThrottled({
                text: (pages[pageIndex] || []).slice(
                    Math.floor(viewportTop / (baseLineHeightPx * fontScale)),
                    Math.ceil((viewportTop + viewportHeight) / (baseLineHeightPx * fontScale))
                ).join("\n"),
                live: true,
                fontScale,
                viewportHeight,
                viewportTop,
                pageIndex
            });
        } else {
            setIsLive(false);
            sendLiveThrottled({ text: "", live: false });
        }
    };

    /* zoom */
    const handleZoomIn = () => setFontScale((s) => Math.min(3, +(s + 0.1).toFixed(2)));
    const handleZoomOut = () => setFontScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)));

    /* on lines/pages change, ensure current frame data present */
    useEffect(() => {
        setFramesPerPage((prev) => {
            const cp = { ...prev };
            for (let i = 0; i < pages.length; i++) {
                if (!cp[i]) cp[i] = { top: 0, height: DEFAULT_VIEWPORT_HEIGHT };
            }
            return cp;
        });
    }, [pages]);

    /* save current viewport into framesPerPage whenever changes */
    useEffect(() => {
        setFramesPerPage((prev) => ({ ...prev, [pageIndex]: { top: viewportTop, height: viewportHeight } }));
    }, [viewportTop, viewportHeight, pageIndex]);

    /* ===========================
       CONTROLES DE PROJEÇÃO (M3 + FS-A + Q1)
       - uses missalAPI.openOnDisplay / toggleBorder / toggleFullscreen
       =========================== */
    const handleOpenProjection = () => {
        if (window.missalAPI?.openOnDisplay) {
            window.missalAPI.openOnDisplay(selectedDisplay);
            setIsProjectionFullscreen(true);
        }
    };

    const handleToggleFullscreen = () => {
        if (window.missalAPI?.toggleFullscreen) {
            window.missalAPI.toggleFullscreen();
            setIsProjectionFullscreen((v) => !v);
        }
    };

    /* helper: render content of page scaled (used for main + mini previews) */
    const renderPageContentScaled = (idx, maxWidthStyle = {}) => {
        const current = pages[idx] || [];
        return (
            <div style={{ transform: `scale(${fontScale})`, transformOrigin: "top left", paddingRight: 8, width: "100%", ...maxWidthStyle }}>
                {current.map((ln, i) => (
                    <div key={i} style={{ minHeight: `${baseLineHeightPx}px`, whiteSpace: "pre-wrap", color: "#ccc" }}>
                        {ln || " "}
                    </div>
                ))}
            </div>
        );
    };

    /* mini-frame renderer (for prev/next) — interactive frame overlay */
    const renderMiniFrameForPage = (idx) => {
        const frame = framesPerPage[idx] || { top: 0, height: DEFAULT_VIEWPORT_HEIGHT };
        return (
            <div
                ref={(el) => { if (idx === pageIndex - 1) prevRef.current = el; if (idx === pageIndex + 1) nextRef.current = el; }}
                style={{ height: "70%", background: "#000", borderRadius: 8, position: "relative", overflow: "hidden", padding: 8 }}
            >
                <div style={{ height: "100%", overflow: "hidden" }}>{renderPageContentScaled(idx)}</div>

                <div
                    onMouseDown={(e) => startDragForPage(e, idx)}
                    style={{
                        position: "absolute",
                        top: frame.top,
                        left: 8,
                        right: 8,
                        height: frame.height,
                        border: "2px dashed rgba(0,183,255,0.6)",
                        background: "rgba(0,183,255,0.03)",
                        cursor: "move",
                        boxSizing: "border-box",
                        pointerEvents: "auto"
                    }}
                >
                    <div
                        onMouseDown={(e) => startResizeForPage(e, idx)}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            height: 12,
                            bottom: -6,
                            cursor: "ns-resize",
                            borderTop: "2px solid rgba(0,183,255,0.6)",
                            pointerEvents: "auto"
                        }}
                        title="Arraste para redimensionar (apenas margem inferior)"
                    />
                </div>
            </div>
        );
    };

    /* ===========================
       JSX — layout 4 colunas restaurado
       =========================== */
    return (
        <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: 20 }}>
            <h2>Painel Operador</h2>

            {/* PROJECTION CONTROLS */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                <label style={{ color: "#ddd" }}>Monitor:</label>
                <select
                    value={selectedDisplay}
                    onChange={(e) => setSelectedDisplay(Number(e.target.value))}
                    style={{ padding: "6px 8px", borderRadius: 6, background: "#222", color: "#fff" }}
                >
                    {displays.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <button onClick={handleOpenProjection}>Abrir Projeção (Fullscreen)</button>
                <button
                    onClick={() => window.missalAPI?.toggleFrame()}
                >
                    {isProjectionFullscreen ? "Mostrar borda da tela" : "Tela sem borda"}
                </button>
                <div style={{ flex: 1 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 1.2fr 1fr", gap: 12, height: "80vh" }}>
                {/* LIST */}
                <div style={{ background: "#222", padding: 10, borderRadius: 8, overflowY: "auto" }}>
                    <h3>Lista</h3>
                    {songs.map((s) => {
                        const sel = selected && s.id === selected.id;
                        return (
                            <div
                                key={s.id}
                                onClick={() => openSong(s)}
                                style={{
                                    padding: 8,
                                    borderBottom: "1px solid #333",
                                    cursor: "pointer",
                                    background: sel ? "rgba(0,183,255,0.08)" : "transparent",
                                    color: sel ? "#00d2ff" : "#fff"
                                }}
                            >
                                {s.numero} — {s.nome}
                            </div>
                        );
                    })}
                </div>

                {/* PREVIEW PAGE (previous) */}
                <div style={{ background: "#181818", padding: 10, borderRadius: 8 }}>
                    <h3>Página anterior</h3>
                    {pageIndex > 0 ? (
                        <>
                            {renderMiniFrameForPage(pageIndex - 1)}
                            <button style={{ marginTop: 10, width: "100%" }} onClick={() => goToPage(pageIndex - 1)}>Ir para página anterior</button>
                        </>
                    ) : (
                        <>
                            <div style={{ height: "70%", background: "#000", borderRadius: 8, padding: 10, color: "#666" }}>Sem página anterior</div>
                            <button disabled style={{ marginTop: 10, width: "100%" }}>Ir para página anterior</button>
                        </>
                    )}
                </div>

                {/* CURRENT PAGE (A4) */}
                <div style={{ background: "#202020", padding: 10, borderRadius: 8 }}>
                    <h3>Página atual</h3>

                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button onClick={handleZoomOut}>– Zoom</button>
                        <button onClick={handleZoomIn}>+ Zoom</button>
                        <button onClick={() => { setViewportTop(0); setViewportHeight(DEFAULT_VIEWPORT_HEIGHT); }}>Reset moldura</button>
                    </div>

                    <div ref={pageRef} style={{
                        height: "70%",
                        background: "#000",
                        border: "1px solid #333",
                        borderRadius: 8,
                        padding: 12,
                        overflow: "hidden",
                        position: "relative",
                        boxSizing: "border-box",
                        userSelect: "none"
                    }}>
                        <div style={{ height: "100%", overflow: "hidden" }}>
                            {renderPageContentScaled(pageIndex)}
                        </div>

                        {/* current frame (editable only by dragging and resizing bottom) */}
                        <div
                            onMouseDown={(e) => {
                                // determine if clicked in handle area: bottom ~14px
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickY = e.clientY - rect.top;
                                const handleZoneStart = rect.height - (Math.min(40, rect.height) + 2);
                                if (clickY < handleZoneStart) {
                                    // start drag for current page
                                    startDragForPage(e, pageIndex);
                                }
                            }}
                            style={{
                                position: "absolute",
                                top: viewportTop,
                                left: 6,
                                right: 6,
                                height: viewportHeight,
                                border: "2px solid #00b7ff",
                                background: "rgba(0,183,255,0.08)",
                                boxSizing: "border-box",
                                cursor: "move",
                                pointerEvents: "auto",
                                zIndex: 8
                            }}
                        >
                            <div
                                onMouseDown={(e) => startResizeForPage(e, pageIndex)}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    height: 14,
                                    bottom: -7,
                                    cursor: "ns-resize",
                                    pointerEvents: "auto",
                                    borderTop: "2px solid rgba(0,183,255,0.6)"
                                }}
                                title="Arraste para redimensionar a moldura (apenas margem inferior)"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <button onClick={toggleLive} style={{ flex: 1 }}>
                            {isLive ? "Finalizar projeção" : "Projetar canto"}
                        </button>

                        <button onClick={voltarAoInicio}>
                            Voltar ao início
                        </button>
                    </div>

                    <h4 style={{ marginTop: 14 }}>Editar texto</h4>
                    <textarea
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        placeholder="Cole ou escreva o texto do canto"
                        style={{ width: "100%", minHeight: 140, marginTop: 6, padding: 10, borderRadius: 8, background: "#111", color: "#eee", border: "1px solid #333" }}
                    />
                </div>

                {/* NEXT / MINI */}
                <div style={{ background: "#181818", padding: 10, borderRadius: 8 }}>
                    <h3>Página seguinte</h3>
                    {pageIndex < pages.length - 1 ? (
                        <>
                            {renderMiniFrameForPage(pageIndex + 1)}
                            <button style={{ marginTop: 10, width: "100%" }} onClick={() => goToPage(pageIndex + 1)}>Ir para página seguinte</button>
                        </>
                    ) : (
                        <>
                            <div style={{ height: "70%", background: "#000", borderRadius: 8, padding: 10, color: "#666" }}>Sem página seguinte</div>
                            <button disabled style={{ marginTop: 10, width: "100%" }}>Ir para página seguinte</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
