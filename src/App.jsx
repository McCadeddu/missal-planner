// App.jsx — Missal Planner (versão final revisada, comentada)
import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";

import Header from "./components/Header";

// --- AUTOSAVE KEYS (constantes utilizadas para persistência local) ---
const AUTOSAVE_LIBRARY = "mp_library_v1";
const SAVED_LISTS_KEY = "mp_saved_lists_v1";
const AUTOSAVE_SELECTED = "mp_selected_v1";
const AUTOSAVE_MASSNAME = "mp_massname_v1";
const AUTOSAVE_MASSDATE = "mp_massdate_v1";
const AUTOSAVE_MODE = "mp_mode_v1";

import LibraryPanel from "./components/library/LibraryPanel";
import Filters from "./components/library/Filters";
import SidebarPanel from "./components/sidebar/SidebarPanel";
import SelectedSongsPanel from "./components/selected/SelectedSongsPanel";
import ModalAddSong from "./components/modals/ModalAddSong";
import ModalSelectSections from "./components/modals/ModalSelectSections";

import cantosCSV from "./data/cantos.csv?raw";

/* ===========================
   Constantes do domínio
   =========================== */

/* modos e seções padrão (mantidos conforme sua versão original) */
const missaSections = [
    "Cantos para ensaiar",
    "Canto de Entrada / Hino L. das Horas",
    "Canto de Pedido de Perdão",
    "Canto do Glória",
    "Refrão de Introdução à Palavra de Deus",
    "Salmo cantado (refrão)",
    "Hino litúrgico cantado",
    "Aclamação ao Evangelho",
    "Refrão para retomar a Palavra de Deus",
    "Canto do Ofertório",
    "Santo cantado",
    "Pai nosso cantado",
    "Cordeiro de Deus cantado",
    "Canto de Comunhão",
    "Canto de Ação de Graças",
    "Canto de eventos particulares",
    "Canto final",
];

const adoracaoSections = [
    "Cantos de Adoração ao Santíssimo",
    "Cantos de Intercessão",
    "Cantos de Louvor",
    "Canto final da adoração",
];

const modes = {
    missa: { label: "Missa", sections: missaSections },
    adoracao: { label: "Adoração", sections: adoracaoSections },
    missaeadoracao: { label: "Missa + Adoração", sections: [...missaSections, ...adoracaoSections] },
};

/* conjuntos que aceitam apenas um item por seção */
const SINGLE_ONLY = new Set([
    "Canto do Glória",
    "Aclamação ao Evangelho",
    "Santo cantado",
    "Pai nosso cantado",
    "Cordeiro de Deus cantado",
]);

/* ===========================
   Helpers utilitários
   =========================== */

/* cria um link e força download de um blob */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/* achata a estrutura de selectedSongs em um array ordenado conforme sectionsOrder */
function flattenSelected(selectedSongs, sectionsOrder = []) {
    const arr = [];
    for (const sec of sectionsOrder) {
        const list = selectedSongs[sec] || [];
        for (let i = 0; i < list.length; i++) {
            arr.push({
                section: sec,
                indexInSection: i,
                ...list[i],
            });
        }
    }
    return arr;
}

/* ===========================
   Componente principal App
   =========================== */

export default function App() {
    /* -----------------------
       Estados principais
       ----------------------- */
    const [songsData, setSongsData] = useState([]); // biblioteca principal (cada item pode ter fullText)
    const [showSavedLists, setShowSavedLists] = useState(false);
    const [savedLists, setSavedLists] = useState([]);
    const [mode, setMode] = useState("missa");
    const [sections, setSections] = useState(modes[mode].sections);
    const [selectedSongs, setSelectedSongs] = useState({}); // cantos na missa atual (por seção)

    const [massName, setMassName] = useState("");
    const [massDate, setMassDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [libraryLoaded, setLibraryLoaded] = useState(false);

    // Biblioteca: filtros / busca / ordenação
    const [globalSearch, setGlobalSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [filterComposer, setFilterComposer] = useState("");
    const [sortMode, setSortMode] = useState("added");

    // Modais e formulários
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSongDraft, setNewSongDraft] = useState({ nome: "", numero: "", composer: "", category: "Geral" });

    const [showSectionModal, setShowSectionModal] = useState(false);

    const [showDeleteLibraryModal, setShowDeleteLibraryModal] = useState(false);
    const [songToDelete, setSongToDelete] = useState(null);

    const [pendingSong, setPendingSong] = useState(null);
    const [pendingSelections, setPendingSelections] = useState({});

    const [showHelp, setShowHelp] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Estado para feedback de atualização
    const [updateStatus, setUpdateStatus] = useState(null);
    const [updateChecking, setUpdateChecking] = useState(false);

    const fileInputLibraryRef = useRef();
    const fileHandleRef = useRef(null);

    // Ref para controlar foco do campo de pesquisa (Filters)
    const searchInputRef = useRef(null);

    /* ===========================
       Inicialização (CSV + Autosave)
       =========================== */

    // 1) Carregar CSV embutido (apenas quando não há biblioteca salva)
    useEffect(() => {
        if (!cantosCSV) return;

        try {
            const parsed = Papa.parse(cantosCSV, { header: true, skipEmptyLines: true });
            const arr = parsed.data
                .map((r, idx) => ({
                    id: idx + 1,
                    numero: (r["NÚMERO"] ?? "").toString().trim(),
                    nome: (r["NOME DO CANTO"] ?? "").toString().trim(),
                    composer: "",
                    category: (r["CATEGORIA"] ?? "Geral").toString().trim(),

                    // 🔒 campos corretos
                    fullTextProjection: "",
                    fullTextMusic: "",
                    tonality: ""
                }))
                .filter(s => s.nome);

            const savedLibraryRaw = localStorage.getItem(AUTOSAVE_LIBRARY);

            if (!savedLibraryRaw) {
                setSongsData(arr);
                setLibraryLoaded(true);
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    // 2) Carregar autosaves (biblioteca, seleção, nome/data da missa, modo)
    useEffect(() => {
        try {
            const savedLibraryRaw = localStorage.getItem(AUTOSAVE_LIBRARY);

            if (savedLibraryRaw) {
                const parsed = JSON.parse(savedLibraryRaw);
                if (Array.isArray(parsed)) {
                    setSongsData(parsed);
                    setLibraryLoaded(true);
                }
            }
        } catch (e) {
            console.warn(e);
        }
    }, []);

    /* ===========================
       Autosave reativo
       =========================== */


    useEffect(() => {
        if (!libraryLoaded) return;

        try {
            localStorage.setItem(
                AUTOSAVE_LIBRARY,
                JSON.stringify(songsData)
            );
        } catch (e) {
            console.warn("Erro ao salvar biblioteca:", e);
        }
    }, [songsData, libraryLoaded]);

    useEffect(() => {
        try {
            localStorage.setItem(AUTOSAVE_SELECTED, JSON.stringify(selectedSongs));
        } catch (e) { }
    }, [selectedSongs]);

    useEffect(() => {
        try {
            localStorage.setItem(AUTOSAVE_MASSNAME, massName);
        } catch (e) { }
    }, [massName]);

    useEffect(() => {
        try {
            localStorage.setItem(AUTOSAVE_MASSDATE, massDate);
        } catch (e) { }
    }, [massDate]);

    useEffect(() => {
        try {
            localStorage.setItem(AUTOSAVE_MODE, mode);
        } catch (e) { }
    }, [mode]);

    // UX: foco automático no campo de pesquisa ao abrir o app
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    /* ===========================
       IPC: receber atualizações de texto vindas do Operator
       Quando o Operator salva/atualiza um texto, o App atualiza
       a biblioteca (songsData) e a seleção atual (selectedSongs).
       =========================== */
    useEffect(() => {
        // se a API não existir (modo browser) apenas ignora
        if (!window.missalAPI?.onSongTextUpdated) return;

        const unsubscribe = window.missalAPI.onSongTextUpdated((payload) => {
            // payload esperado: { id, fullText }
            if (!payload || !payload.id) return;

            const { id, fullText } = payload;

            // 1) Atualiza a biblioteca (songsData)
            setSongsData((prev) => {
                const updated = prev.map((s) =>
                    s.id === id ? { ...s, fullText } : s
                );
                try {
                    localStorage.setItem(AUTOSAVE_LIBRARY, JSON.stringify(updated));
                    // flag simples para sinalizar atualização externa (fallback)
                    localStorage.setItem("mp_library_last_update", Date.now().toString());
                } catch (e) { /* ignore storage errors */ }
                return updated;
            });

            // 2) Atualiza a seleção atual (selectedSongs)
            setSelectedSongs((prev) => {
                const out = { ...prev };
                for (const sec of Object.keys(out)) {
                    out[sec] = out[sec].map((item) =>
                        item.id === id ? { ...item, fullText } : item
                    );
                }
                try {
                    localStorage.setItem(AUTOSAVE_SELECTED, JSON.stringify(out));
                } catch (e) { /* ignore */ }
                return out;
            });
        });

        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!window.missalAPI?.onUpdateAvailable) return;

        const unsubscribeA = window.missalAPI.onUpdateAvailable((info) => {
            setUpdateStatus(`Nova versão disponível: v${info.version}`);
        });

        const unsubscribeP = window.missalAPI.onUpdateProgress((p) => {
            setUpdateStatus(`Baixando atualização: ${Math.floor(p.percent)}%`);
        });

        return () => {
            unsubscribeA?.();
            unsubscribeP?.();
        };
    }, []);

    /* ===========================
       Consistência: criar entradas ausentes na biblioteca
       quando um canto é selecionado mas não existe
       =========================== */

    useEffect(() => {
        const flatSelected = flattenSelected(selectedSongs, sections);

        setSongsData((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newOnes = [];

            for (const item of flatSelected) {
                if (!existingIds.has(item.id)) {
                    newOnes.push({
                        id: item.id,
                        numero: item.numero || "",
                        nome: item.nome || "",
                        composer: item.composer || "",
                        category: item.category || "Geral",
                        fullText: item.fullText || "",
                    });
                }
            }

            if (newOnes.length > 0) {
                return [...prev, ...newOnes];
            }
            return prev;
        });
    }, [selectedSongs, sections]);

    useEffect(() => {
        setSections(modes[mode].sections);
    }, [mode]);

    /* ===========================
       Fallback: detectar atualizações de biblioteca via localStorage
       (útil quando Operator roda como janela separada que escreve localStorage)
       =========================== */

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "mp_library_last_update") {
                try {
                    const raw = localStorage.getItem(AUTOSAVE_LIBRARY);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            setSongsData(parsed.map((s) => ({ ...s, fullText: s.fullText || "" })));
                        }
                    }
                } catch (err) {
                    console.error("Erro ao atualizar biblioteca via fallback:", err);
                }
            }
        };

        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    /* ===========================
       Filtragem e categorias
       =========================== */

    const filteredSongs = songsData
        .filter((s) => {
            if (filterCategory && filterCategory !== "Todas" && s.category !== filterCategory) return false;
            if (filterComposer && !s.composer.toLowerCase().includes(filterComposer.toLowerCase())) return false;
            if (globalSearch) {
                const q = globalSearch.toLowerCase();
                return (s.nome || "").toLowerCase().includes(q) || (s.numero || "").toLowerCase().includes(q) || (s.composer || "").toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => {
            if (sortMode === "nome") return a.nome.localeCompare(b.nome);
            if (sortMode === "numero") return a.numero.localeCompare(b.numero);
            return 0;
        });

    const categoriesList = Array.from(new Set(["Geral", ...songsData.map((s) => s.category)]));

    /* ===========================
       Saved lists utilities
       =========================== */

    const getSavedLists = () => {
        try {
            const raw = localStorage.getItem(SAVED_LISTS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };

    const saveCurrentList = () => {
        try {
            const lists = getSavedLists();

            const newEntry = {
                id: Date.now(),
                missa: massName || "Sem nome",
                data: massDate,
                cantos: selectedSongs
            };

            const next = [newEntry, ...lists];
            localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(next));
            setSavedLists(next);

            alert("Lista salva com sucesso!");
        } catch (e) {
            console.error("Erro ao salvar lista:", e);
            alert("Erro ao salvar lista.");
        }
    };

    const openSavedList = (entry) => {
        if (!entry) return;
        setMassName(entry.missa || "");
        setMassDate(entry.data || new Date().toISOString().slice(0, 10));
        setSelectedSongs(entry.cantos || {});
        setShowSavedLists(false);
    };

    const deleteSavedList = (id) => {
        const lists = getSavedLists().filter(l => l.id !== id);
        localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists));
        setSavedLists(lists);
    };

    /* ===========================
       Ações: adicionar / editar / remover / selecionar
       =========================== */

    const openSectionModalForSong = (song) => {
        setPendingSong(song);
        const initial = {};
        for (const s of sections) initial[s] = false;
        setPendingSelections(initial);
        setShowSectionModal(true);
    };

    const confirmSectionSelection = () => {
        if (!pendingSong) return;
        const chosen = Object.keys(pendingSelections).filter((k) => pendingSelections[k]);
        if (chosen.length === 0) {
            alert("Escolha ao menos uma seção.");
            return;
        }

        setSelectedSongs((prev) => {
            const next = { ...prev };
            for (const sec of chosen) {
                if (SINGLE_ONLY.has(sec)) {
                    next[sec] = [{ ...pendingSong }];
                } else {
                    next[sec] = Array.isArray(next[sec])
                        ? [...next[sec], { ...pendingSong }]
                        : [{ ...pendingSong }];
                }
            }
            return next;
        });

        // 🔁 UX: limpar pesquisa e voltar foco automaticamente
        setGlobalSearch("");
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);

        setShowSectionModal(false);
        setPendingSong(null);
    };

    const removeFromSection = (section, index = null) => {
        setSelectedSongs((prev) => {
            const copy = { ...prev };
            if (!copy[section]) return copy;
            if (index === null) {
                delete copy[section];
            } else {
                const arr = [...copy[section]];
                arr.splice(index, 1);
                if (arr.length === 0) delete copy[section];
                else copy[section] = arr;
            }
            return copy;
        });
    };

    const openEditSelectedItem = (section, index) => {
        const item = selectedSongs[section] && selectedSongs[section][index];
        if (!item) return;
        alert("Editar: " + (item.nome || ""));
    };

    const openDeleteLibraryModal = () => {
        setShowDeleteLibraryModal(true);
    };

    const saveNewSong = () => {
        if (!newSongDraft.nome || newSongDraft.nome.trim().length === 0) {
            alert("Nome vazio");
            return;
        }
        setSongsData((prev) => [
            ...prev,
            {
                id: prev.length + 1,
                fullText: "", // novo campo inicializado
                ...newSongDraft,
            },
        ]);
        setShowAddModal(false);
        setNewSongDraft({ nome: "", numero: "", composer: "", category: "Geral" });
    };

    const handleLibraryAdd = (song) => {
        openSectionModalForSong(song);
    };

    const handleLibraryEdit = (song) => {
        setNewSongDraft({ nome: song.nome, numero: song.numero, composer: song.composer || "", category: song.category || "Geral" });
        setShowAddModal(true);
    };

    const deleteSongFromLibrary = (id) => {
        // Remove da biblioteca
        setSongsData(prev => prev.filter(song => song.id !== id));

        // Remove de qualquer seção selecionada
        setSelectedSongs(prev => {
            const out = {};
            for (const key in prev) {
                const arr = prev[key].filter(song => song.id !== id);
                if (arr.length > 0) out[key] = arr;
            }
            return out;
        });
    };

    /* ===========================
       CSV / JSON import & export
       - preservam fullText onde aplicável
       =========================== */

    const exportLibraryAsCSV = () => {
        const rows = songsData.map((s) => ({
            "NÚMERO": s.numero || "",
            "NOME DO CANTO": s.nome || "",
            "COMPOSITOR": s.composer || "",
            "CATEGORIA": s.category || "Geral",
            // NÃO incluímos fullText por padrão em CSV (pode inflar demais)
        }));

        const csv = Papa.unparse(rows, { header: true });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `biblioteca_atualizada_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const importLibraryCSV = (file) => {
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const arr = results.data
                    .map((r, idx) => {
                        const nome = (r["NOME DO CANTO"] ?? r["NOME"] ?? "").toString().trim();
                        if (!nome) return null;

                        return {
                            id: Date.now() + idx,
                            numero: (r["NÚMERO"] ?? r["NUMERO"] ?? "").toString().trim(),
                            nome,
                            composer: (r["COMPOSITOR"] ?? "").toString().trim(),
                            category: (r["CATEGORIA"] ?? "Geral").toString().trim(),
                            fullText: "",
                        };
                    })
                    .filter(Boolean);

                if (arr.length > 0) {
                    setSongsData((prev) => [...prev, ...arr]);
                }

                alert(`Importados ${arr.length} cantos para a biblioteca.`);
            },
            error: (e) => alert("Erro ao importar CSV: " + e.message),
        });
    };

    const exportLibraryJSON = () => {
        const blob = new Blob([JSON.stringify(songsData, null, 2)], {
            type: "application/json",
        });

        downloadBlob(blob, `biblioteca_cantos_${new Date().toISOString().slice(0, 10)}.json`);
    };

    const importLibraryJSON = (file) => {
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if (!Array.isArray(imported)) {
                    alert("O arquivo JSON não contém uma lista válida de cantos.");
                    return;
                }

                // Normalizar e gerar IDs novos — preservando fullText se existir
                const normalized = imported.map((item, idx) => ({
                    id: Date.now() + idx,
                    numero: item.numero || "",
                    nome: item.nome || "",
                    composer: item.composer || "",
                    category: item.category || "Geral",
                    fullText: item.fullText || "",
                }));

                setSongsData((prev) => [...prev, ...normalized]);

                alert(`Importados ${normalized.length} cantos da biblioteca JSON.`);
            } catch (error) {
                alert("Arquivo JSON inválido.");
            }
        };

        reader.readAsText(file, "utf-8");
    };

    /* ===========================
       PDF generation (mantive suas funções e estilo)
       =========================== */

    const generatePDF = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const margin = 35;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;

        let y = margin;

        // ===========================
        // Cabeçalho CMV
        // ===========================
        y += 12;
        doc.setDrawColor(199, 126, 74);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;

        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text(massName || "Planejador de Missas", pageWidth / 2, y, { align: "center" });
        y += 20;

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(`Data: ${massDate}`, pageWidth / 2, y, { align: "center" });
        y += 20;

        doc.setDrawColor(199, 126, 74);
        doc.line(margin, y, pageWidth - margin, y);
        y += 25;

        // ===========================
        // Lista litúrgica
        // ===========================
        const flat = flattenSelected(selectedSongs, sections);
        let lastSection = null;

        for (const item of flat) {

            // SEÇÃO — aparece apenas quando muda
            if (item.section !== lastSection) {
                lastSection = item.section;

                doc.setFont("times", "bold");
                doc.setTextColor(0, 68, 170); // azul CMV
                doc.setFontSize(13);

                const secLines = doc.splitTextToSize(item.section, maxWidth);
                doc.text(secLines, margin, y);
                y += secLines.length * 16;

                doc.setTextColor(0, 0, 0); // reset back to black
            }

            // CANTO em maiúsculo e negrito
            const canto = `${item.numero ? item.numero + " — " : ""}${item.nome}`.toUpperCase();

            doc.setFont("times", "bold");
            doc.setFontSize(12);

            const cantoLines = doc.splitTextToSize(canto, maxWidth);
            doc.text(cantoLines, margin + 12, y);
            y += cantoLines.length * 14;

            // Compositor
            if (item.composer) {
                doc.setFont("times", "italic");
                doc.setFontSize(10);
                const comp = doc.splitTextToSize(`Compositor: ${item.composer}`, maxWidth);
                doc.text(comp, margin + 12, y);
                y += comp.length * 12;
            }

            y += 10;

            // Quebra de página
            if (y > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        }

        const filename = `${(massName || "missal").replace(/\s+/g, "_")}_${massDate}.pdf`;
        doc.save(filename);
    };

    const generateTeamPDF = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 30;

        const colWidth = (pageWidth - margin * 2) / 2;
        const maxTextWidth = colWidth - 40;

        const flat = flattenSelected(selectedSongs, sections);

        const linesFull = flat.map((it) => ({
            section: it.section,
            canto: `${it.numero ? it.numero + " — " : ""}${it.nome}`.toUpperCase(),
        }));

        const drawBlock = (x, y) => {
            let cursorY = y + 20;

            // Título
            doc.setFont("times", "bold");
            doc.setFontSize(13);
            const titleLines = doc.splitTextToSize(massName || "Planejador de Missas", maxTextWidth);
            doc.text(titleLines, x + 12, cursorY);
            cursorY += titleLines.length * 14;

            // Data
            doc.setFont("times", "italic");
            doc.setFontSize(10);
            doc.text(`Data: ${massDate}`, x + 12, cursorY);
            cursorY += 14;

            // Linha
            doc.setDrawColor(199, 126, 74);
            doc.line(x + 12, cursorY, x + colWidth - 28, cursorY);
            cursorY += 14;

            let lastSection = null;

            for (const entry of linesFull) {

                // SEÇÃO — azul CMV
                if (entry.section !== lastSection) {
                    lastSection = entry.section;

                    doc.setFont("times", "bold");
                    doc.setFontSize(13); // mesmo tamanho do PDF normal
                    doc.setTextColor(0, 68, 170); // azul CMV (#0044aa)

                    const secLines = doc.splitTextToSize(entry.section, maxTextWidth);
                    doc.text(secLines, x + 12, cursorY);
                    cursorY += secLines.length * 12;
                                        
                }

                // CANTO — mais evidente
                doc.setFont("times", "bold");
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);

                const cantoLines = doc.splitTextToSize(entry.canto, maxTextWidth);
                doc.text(cantoLines, x + 12, cursorY);
                cursorY += cantoLines.length * 12;

                cursorY += 6;
            }

            const blockHeight = cursorY - y + 10;
            doc.setDrawColor(199, 126, 74);
            doc.rect(x, y, colWidth - 8, blockHeight);
        };

        if (linesFull.length <= 10) {
            drawBlock(margin, margin);
            drawBlock(margin + colWidth, margin);
            drawBlock(margin, margin + pageHeight / 2);
            drawBlock(margin + colWidth, margin + pageHeight / 2);

            const filename = `${(massName || "missal")}_equipe_${massDate}.pdf`;
            return doc.save(filename);
        }

        drawBlock(margin, margin);
        drawBlock(margin + colWidth, margin);

        doc.addPage();
        drawBlock(margin, margin);
        drawBlock(margin + colWidth, margin);

        const filename = `${(massName || "missal")}_equipe_${massDate}.pdf`;
        doc.save(filename);
    };

    /* ===========================
       Import / Export de listas (JSON usado pela aplicação)
       - Import mantém fullText onde existir
       =========================== */

    const importJSON = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                setMassName(parsed.missa || "");
                setMassDate(parsed.data || "");
                if (parsed.cantos && typeof parsed.cantos === "object") {
                    const next = {};
                    for (const sec of Object.keys(parsed.cantos)) {
                        next[sec] = parsed.cantos[sec].map((item) => ({ ...item, fullText: item.fullText || "" }));
                    }
                    setSelectedSongs(next);
                }
                alert("Arquivo JSON importado.");
            } catch {
                alert("Arquivo JSON inválido.");
            }
        };
        reader.readAsText(file, "utf-8");
    };

    const exportJSON = () => {
        // ordenar seções conforme a ordem litúrgica atual
        const ordered = {};
        sections.forEach((sec) => {
            if (selectedSongs[sec]) {
                ordered[sec] = selectedSongs[sec].map((item) => ({
                    ...item,
                    fullText: item.fullText || "",
                }));
            }
        });

        const payload = {
            missa: massName,
            data: massDate,
            cantos: ordered,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${(massName || "missal").replace(/\s+/g, "_")}_${massDate}.json`);
    };

    const checkForUpdates = async () => {
        if (!window.missalAPI?.checkForUpdates) {
            alert("Atualizações automáticas estão disponíveis somente na versão Electron.");
            return;
        }

        setUpdateChecking(true);
        setUpdateStatus("Verificando atualizações…");

        try {
            const resp = await window.missalAPI.checkForUpdates();

            setUpdateChecking(false);

            if (resp.error) {
                setUpdateStatus("Erro ao buscar atualização.");
                return;
            }

            if (resp.found) {
                setUpdateStatus(`Nova versão disponível: v${resp.version}. Download iniciará automaticamente.`);
            } else {
                setUpdateStatus("Você já está usando a versão mais recente.");
            }

        } catch (err) {
            setUpdateChecking(false);
            setUpdateStatus("Erro inesperado.");
        }
    };
        /* ===========================
           UI: renderização principal
           =========================== */

        return (
            <>
                <Header />

                <div
                    className="max-w-6xl mx-auto mt-4 mb-6 p-4 rounded-xl"
                    style={{ backgroundColor: "#0d6efd" }}
                >
                    <button
                        onClick={() => setShowHelp(true)}
                        className="px-4 py-2 rounded-xl btn-cmv-outline"
                        style={{ backgroundColor: "white", color: "#0044aa", fontWeight: "600" }}
                    >
                        📘 Como usar o Missal-Planner
                    </button>
                </div>

                <div className="min-h-screen p-6" style={{ background: "var(--cmv-bg, #f1e5ae)", color: "var(--cmv-text, #222)", fontFamily: "var(--font-sans, system-ui)" }}>
                    <div className="max-w-6xl mx-auto mb-6">
                        <input type="text" placeholder="Nome da Missa" value={massName} onChange={(e) => setMassName(e.target.value)}
                            className="w-full p-2 text-1xl font-bold rounded-xl shadow-sm"
                            style={{ background: "white", color: "var(--cmv-text)", fontFamily: "var(--font-heading)", borderBottom: "4px solid #c77e4a" }} />

                        <div className="mt-3">
                            <label className="text-sm mb-1 block" style={{ color: "var(--cmv-muted)" }}>Inserir Data</label>
                            <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)} className="p-2 rounded" style={{ background: "white", border: "1px solid var(--cmv-primary)", color: "var(--cmv-text)" }} />
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="col-span-2">
                            <div className="p-4 rounded-xl shadow-md cmv-border" style={{ background: "white" }}>
                                <div className="w-full flex flex-wrap items-center gap-4 mb-6">
                                    <button
                                        onClick={() => {
                                            setSavedLists(getSavedLists());
                                            setShowSavedLists(true);
                                        }}
                                        className="px-5 py-2 rounded-xl font-semibold btn-cmv-outline"
                                    >
                                        📂 Abrir Lista de Cantos
                                    </button>

                                    <label className="px-5 py-2 rounded-xl cursor-pointer font-semibold btn-cmv-outline">
                                        Importar lista .json
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => importJSON(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>

                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className="px-5 py-2 rounded-xl font-semibold btn-cmv-outline"
                                    >
                                        ⚙️ Configurações
                                    </button>
                                </div>

                                <Filters globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}
                                    filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                                    filterComposer={filterComposer} setFilterComposer={setFilterComposer}
                                    sortMode={sortMode} setSortMode={setSortMode}
                                    categoriesList={categoriesList} searchInputRef={searchInputRef} />

                                <div className="mt-4">
                                    <LibraryPanel songs={filteredSongs} onAdd={handleLibraryAdd} onEdit={handleLibraryEdit} />
                                </div>

                                <div className="relative inline-block">
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-5 py-2 rounded-xl font-semibold btn-cmv-outline"
                                    >
                                        Novo Canto
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6">
                                <SelectedSongsPanel selectedSongs={selectedSongs} sections={sections} onRemove={({ section, indexInSection }) => removeFromSection(section, indexInSection ?? null)} onEdit={({ section, indexInSection }) => openEditSelectedItem(section, indexInSection)} />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button onClick={saveCurrentList} className="px-3 py-2 rounded btn-cmv-outline">
                                    💾 Salvar Lista
                                </button>

                                <button onClick={exportJSON} className="px-3 py-2 rounded btn-cmv-outline">Export .json</button>

                                <button onClick={generatePDF} className="px-3 py-2 rounded btn-cmv-outline">Gerar PDF</button>

                                <button onClick={generateTeamPDF} className="px-3 py-2 rounded btn-cmv-outline">PDF Equipe</button>

                                <button
                                    onClick={() => {
                                        const flat = flattenSelected(selectedSongs, sections);

                                        if (!window.missalAPI?.openOperatorAndProjection) {
                                            alert(
                                                "A projeção funciona somente na versão Electron.\n" +
                                                "Instale o aplicativo para usar o Painel Operador e a Projeção."
                                            );
                                            return;
                                        }

                                        window.missalAPI.openOperatorAndProjection(flat);
                                    }}
                                    className="px-3 py-2 rounded btn-cmv-outline"
                                >
                                    🎥 Abrir Projeção
                                </button>
                            </div>
                        </div>

                        <div className="col-span-1">
                            <SidebarPanel mode={mode} setMode={setMode} modes={modes} sections={sections} categoriesList={categoriesList} setFilterCategory={setFilterCategory} setSelectedSongs={setSelectedSongs} />
                        </div>
                    </div>
                </div>

                {/* Modal Configurações */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="p-6 rounded-xl shadow-xl cmv-border"
                            style={{ background: "white", width: "420px" }}>

                            <h2 className="h-liturgico mb-4" style={{ fontSize: "1.6rem" }}>
                                ⚙️ Configurações
                            </h2>

                            <div className="space-y-3">

                                <button
                                    onClick={checkForUpdates}
                                    disabled={updateChecking}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline w-full"
                                >
                                    🔄 Procurar atualizações
                                </button>

                                {updateStatus && (
                                    <div className="mt-2 text-sm text-center" style={{ color: "#333" }}>
                                        {updateStatus}
                                    </div>
                                )}

                                <label className="px-4 py-2 rounded-xl cursor-pointer btn-cmv-outline w-full block text-left">
                                    Importar CSV — Biblioteca
                                    <input
                                        type="file"
                                        accept=".csv"
                                        ref={fileInputLibraryRef}
                                        onChange={(e) => importLibraryCSV(e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>

                                <button
                                    onClick={exportLibraryAsCSV}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline w-full">
                                    Exportar CSV — Biblioteca
                                </button>

                                <button
                                    onClick={exportLibraryJSON}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline w-full"
                                >
                                    Exportar Biblioteca — JSON
                                </button>

                                <label className="px-4 py-2 rounded-xl cursor-pointer btn-cmv-outline w-full block text-left">
                                    Importar Biblioteca — JSON
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => importLibraryJSON(e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>

                                <button
                                    onClick={openDeleteLibraryModal}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline w-full"
                                >
                                    Eliminar canto da Biblioteca
                                </button>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Eliminar canto da Biblioteca */}
                {showDeleteLibraryModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="p-6 rounded-xl shadow-xl cmv-border"
                            style={{ background: "white", width: "760px", maxHeight: "80vh", overflowY: "auto" }}>

                            <h2 className="h-liturgico mb-4" style={{ fontSize: "1.6rem" }}>
                                Eliminar canto da Biblioteca
                            </h2>

                            <div className="grid grid-cols-3 gap-4">
                                {songsData.length === 0 && (
                                    <p>Nenhum canto na biblioteca.</p>
                                )}

                                {songsData.map((s) => (
                                    <div key={s.id} className="p-4 border rounded-md bg-white">
                                        <div className="font-bold" style={{ color: "var(--cmv-text)" }}>
                                            {s.nome || s.title}
                                        </div>

                                        <div style={{ color: "var(--cmv-muted)", marginBottom: "0.5rem" }}>
                                            {s.numero ? `#${s.numero}` : ""} {s.compositor ? ` — ${s.compositor}` : ""}
                                        </div>

                                        <button
                                            className="px-3 py-1 rounded bg-red-600 text-white"
                                            onClick={() => {
                                                if (window.confirm(`Eliminar o canto "${s.nome || s.title}"?`)) {
                                                    deleteSongFromLibrary(s.id);
                                                }
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowDeleteLibraryModal(false)}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Ajuda */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="p-6 rounded-xl shadow-xl cmv-border"
                            style={{ background: "white", width: "620px", maxHeight: "80vh", overflowY: "auto" }}>

                            <h2 className="h-liturgico mb-4" style={{ fontSize: "1.6rem" }}>
                                📘 Como usar o Missal-Planner
                            </h2>

                            <p style={{ marginBottom: "1rem", color: "var(--cmv-text)" }}>
                                O Missal-Planner nasceu do desejo de ajudar as equipes de canto
                                da Comunidade Missionária de Villaregia a organizar todos os
                                momentos de oração cantada das Missas e das Adorações.
                            </p>

                            <p className="mb-2">
                                Ele foi pensado para oferecer:
                            </p>

                            <ul className="list-disc ml-5 space-y-1" style={{ color: "var(--cmv-text)" }}>
                                <li>Uma biblioteca de cantos sempre atualizada</li>
                                <li>Escolha rápida dos cantos por momentos litúrgicos</li>
                                <li>Planejamento de Missa e Adoração com clareza</li>
                                <li>Geração automática de PDFs para a equipe</li>
                                <li>Exportação e importação em CSV ou JSON</li>
                                <li>Autosave automático: o app nunca perde seu trabalho</li>
                            </ul>

                            <h3 className="mt-4 font-semibold" style={{ color: "var(--cmv-text)" }}>
                                Como funciona:
                            </h3>

                            <ol className="list-decimal ml-5 space-y-1" style={{ color: "var(--cmv-text)" }}>
                                <li>Escolha o modo (Missa / Adoração).</li>
                                <li>Filtre, procure e selecione cantos na biblioteca.</li>
                                <li>Adicione cantos aos momentos litúrgicos desejados.</li>
                                <li>Edite ou remova cantos conforme necessário.</li>
                                <li>Gere PDFs para impressão.</li>
                                <li>Use a seção Configurações para importar/exportar bibliotecas personalizadas.</li>
                            </ol>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Listas salvas */}
                {showSavedLists && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="p-6 rounded-xl shadow-xl cmv-border"
                            style={{ background: "white", width: "520px", maxHeight: "80vh", overflowY: "auto" }}>

                            <h2 className="h-liturgico mb-4" style={{ fontSize: "1.6rem" }}>
                                📂 Listas Salvas
                            </h2>

                            {savedLists.length === 0 && (
                                <p>Nenhuma lista salva ainda.</p>
                            )}

                            {savedLists.map((entry) => (
                                <div key={entry.id} className="p-3 border rounded mb-3 bg-white">
                                    <div className="font-bold">{entry.missa}</div>
                                    <div className="text-sm" style={{ color: "var(--cmv-muted)" }}>{entry.data}</div>

                                    <div className="mt-2">
                                        <button
                                            className="px-3 py-1 mr-2 rounded btn-cmv-outline"
                                            onClick={() => openSavedList(entry)}
                                        >
                                            Abrir
                                        </button>

                                        <button
                                            className="px-3 py-1 rounded bg-red-600 text-white"
                                            onClick={() => {
                                                if (window.confirm("Eliminar esta lista?")) deleteSavedList(entry.id);
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end mt-4">
                                <button
                                    className="px-4 py-2 rounded-xl btn-cmv-outline"
                                    onClick={() => setShowSavedLists(false)}
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modals auxiliares finais */}
                <ModalAddSong visible={showAddModal} onClose={() => setShowAddModal(false)} draft={newSongDraft} setDraft={setNewSongDraft} onSave={saveNewSong} />
                <ModalSelectSections visible={showSectionModal} pendingSong={pendingSong} sections={sections} pendingSelections={pendingSelections} setPendingSelections={setPendingSelections} onConfirm={confirmSectionSelection} onClose={() => setShowSectionModal(false)} />
            </>
        );
}
