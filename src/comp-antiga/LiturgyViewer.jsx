import React, { useEffect, useState } from "react";

export default function LiturgyViewer({ source }) {
    const [data, setData] = useState(null);
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        setErro("");
        setData(null);

        try {
            // Criar AbortController com timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const url = `/api/liturgia/${source}`;
            const resp = await fetch(url, { signal: controller.signal });

            clearTimeout(timeout);

            if (!resp.ok) {
                throw new Error("HTTP " + resp.status);
            }

            const json = await resp.json();
            setData(json);
        } catch (err) {
            // Não mostrar erro se o abort foi intencional (mudança de aba ou timeout normal)
            if (err.name === "AbortError") {
                console.log("Requisição cancelada (normal).");
                return;
            }

            console.error(err);
            setErro("Não foi possível carregar a liturgia.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [source]);

    return (
        <div className="p-4 border rounded bg-white shadow">
            <h3 className="font-semibold mb-2">
                Liturgia diária — {source.toUpperCase()}
            </h3>

            {/* Estado carregando */}
            {loading && <p className="text-slate-500 text-sm">Carregando…</p>}

            {/* Estado erro */}
            {!loading && erro && (
                <div className="text-red-600 text-sm">
                    <p>{erro}</p>
                    <button
                        onClick={load}
                        className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Conteúdo carregado */}
            {!loading && data && !erro && (
                <div className="mt-2 space-y-3">
                    {data.titulo && (
                        <h4 className="font-bold text-slate-800">{data.titulo}</h4>
                    )}

                    {/* CNBB */}
                    {data.leitura && (
                        <p className="text-sm text-slate-700">{data.leitura}</p>
                    )}

                    {/* CEI */}
                    {Array.isArray(data.blocos) && data.blocos.length > 0 && (
                        <div className="space-y-1">
                            {data.blocos.map((t, i) => (
                                <p key={i} className="text-sm text-slate-700">
                                    {t}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Vatican */}
                    {Array.isArray(data.leituras) && data.leituras.length > 0 && (
                        <div className="space-y-1">
                            {data.leituras.map((t, i) => (
                                <p key={i} className="text-sm text-slate-700">
                                    {t}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
