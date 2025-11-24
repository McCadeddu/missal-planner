import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";

import Header from "./components/Header";
import Tooltip from "./components/Tooltip";

import LibraryPanel from "./components/library/LibraryPanel";
import Filters from "./components/library/Filters";
import SidebarPanel from "./components/sidebar/SidebarPanel";
import SelectedSongsPanel from "./components/selected/SelectedSongsPanel";
import ModalAddSong from "./components/modals/ModalAddSong";
import ModalSelectSections from "./components/modals/ModalSelectSections";

import cantosCSV from "./data/cantos.csv?raw";

/* modos e seções (mantidos) */
const missaSections = [
    "Canto de Entrada / Hino das Horas",
    "Canto de Pedido de Perdão",
    "Canto do Glória",
    "Refrão de Introdução à Palavra de Deus",
    "Salmo cantado (refrão)",
    "Hino litúrgico cantado",
    "Aclamação ao Evangelho",
    "Canto do Ofertório",
    "Santo cantado",
    "Pai nosso cantado",
    "Cordeiro de Deus cantado",
    "Canto de Comunhão",
    "Canto de Ação de Graças",
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

const SINGLE_ONLY = new Set([
    "Canto do Glória",
    "Aclamação ao Evangelho",
    "Santo cantado",
    "Pai nosso cantado",
    "Cordeiro de Deus cantado",
]);

/* util helpers */
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

export default function App() {
    const [tooltip, setTooltip] = useState(null);

    const [songsData, setSongsData] = useState([]);
    const [mode, setMode] = useState("missa");
    const [sections, setSections] = useState(modes[mode].sections);
    const [selectedSongs, setSelectedSongs] = useState({});

    const [massName, setMassName] = useState("");
    const [massDate, setMassDate] = useState(() => new Date().toISOString().slice(0, 10));

    // library controls
    const [globalSearch, setGlobalSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("Todas");
    const [filterComposer, setFilterComposer] = useState("");
    const [sortMode, setSortMode] = useState("added");

    // modals / pending
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSongDraft, setNewSongDraft] = useState({ nome: "", numero: "", composer: "", category: "Geral" });

    const [showSectionModal, setShowSectionModal] = useState(false);
    const [pendingSong, setPendingSong] = useState(null);
    const [pendingSelections, setPendingSelections] = useState({});

    // settings modal
    const [showSettings, setShowSettings] = useState(false);

    const fileInputLibraryRef = useRef();
    const fileInputSelectedRef = useRef();

    useEffect(() => {
        if (!cantosCSV) return;
        try {
            const parsed = Papa.parse(cantosCSV, { header: true, skipEmptyLines: true });
            const arr = parsed.data
                .map((r, idx) => {
                    const nome = (r["NOME DO CANTO"] ?? r["NOME"] ?? r["Nome do Canto"] ?? r["nome"] ?? r["NOME_DO_CANTO"] ?? "").toString().trim();
                    const numero = (r["NÚMERO"] ?? r["NUMERO"] ?? r["Número"] ?? r["numero"] ?? "").toString().trim();
                    const category = (r["CATEGORIA"] ?? r["categoria"] ?? "Geral").toString().trim() || "Geral";
                    const composer = (r["COMPOSER"] ?? r["COMPOSITOR"] ?? r["composer"] ?? "").toString().trim();
                    return { id: idx + 1, numero, nome, composer, category };
                })
                .filter((s) => s.nome);
            setSongsData(arr);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        setSections(modes[mode].sections);
        setSelectedSongs((prev) => {
            const copy = { ...prev };
            for (const sec of Object.keys(copy)) {
                if (!modes[mode].sections.includes(sec)) delete copy[sec];
            }
            return copy;
        });
    }, [mode]);

    /* filtered songs for library */
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

    /* actions */
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
                    next[sec] = Array.isArray(next[sec]) ? [...next[sec], { ...pendingSong }] : [{ ...pendingSong }];
                }
            }
            return next;
        });

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

    const saveNewSong = () => {
        if (!newSongDraft.nome || newSongDraft.nome.trim().length === 0) {
            alert("Nome vazio");
            return;
        }
        setSongsData((prev) => [...prev, { id: prev.length + 1, ...newSongDraft }]);
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

    /* ------------------ CSV: export/import biblioteca ------------------ */

    // Exportar biblioteca como CSV (NOME, NÚMERO, CATEGORIA, COMPOSER)
    const exportLibraryAsCSV = () => {
        const rows = songsData.map((s) => ({ numero: s.numero || "", nome: s.nome || "", category: s.category || "", composer: s.composer || "" }));
        const csv = Papa.unparse(rows, { header: true });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `biblioteca_cantos_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    // Importar CSV para biblioteca (apenas colunas: numero, nome, category, composer são lidas)
    const importLibraryCSV = (file) => {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                const arr = results.data.map((r, idx) => {
                    return {
                        id: songsData.length + idx + 1,
                        numero: (r.numero ?? r.NUMERO ?? r["NÚMERO"] ?? "").toString().trim(),
                        nome: (r.nome ?? r.NOME ?? r["NOME DO CANTO"] ?? "").toString().trim(),
                        category: (r.category ?? r.CATEGORIA ?? "Geral").toString().trim() || "Geral",
                        composer: (r.composer ?? r.COMPOSER ?? "").toString().trim(),
                    };
                }).filter(s => s.nome);
                if (arr.length > 0) setSongsData(prev => [...prev, ...arr]);
                alert(`Importados ${arr.length} cantos para a biblioteca.`);
            },
            error: function (e) { alert("Erro ao importar CSV: " + e.message); }
        });
    };

    /* ------------------ CSV: export/import lista selecionada ------------------ */

    // Exportar lista selecionada (nome + numero)
    const exportSelectedAsCSV = () => {
        const flat = flattenSelected(selectedSongs, sections);
        const rows = flat.map((it) => ({ section: it.section, numero: it.numero || "", nome: it.nome || "" }));
        const csv = Papa.unparse(rows, { header: true });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `lista_cantos_${(massName || 'missal').replace(/\s+/g, '_')}_${massDate}.csv`);
    };

    // Importar CSV para lista selecionada (assume colunas numero,nome[,section])
    const importSelectedCSV = (file) => {
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete(results) {
                const rows = results.data;
                if (!rows || rows.length === 0) { alert("CSV vazio"); return; }
                const newSelected = { ...selectedSongs };
                for (const r of rows) {
                    const nome = (r.nome ?? r.NOME ?? "").toString().trim();
                    const numero = (r.numero ?? r.NUMERO ?? "").toString().trim();
                    const section = (r.section ?? r.SECTION ?? sections[0]) || sections[0];
                    if (!nome) continue;
                    const found = songsData.find(s => (s.numero && s.numero.toString() === numero) || (s.nome && s.nome.toLowerCase() === nome.toLowerCase()));
                    const songObj = found ? { ...found } : { id: Date.now(), numero, nome, composer: "", category: "Geral" };
                    if (SINGLE_ONLY.has(section)) newSelected[section] = [songObj];
                    else newSelected[section] = Array.isArray(newSelected[section]) ? [...newSelected[section], songObj] : [songObj];
                }
                setSelectedSongs(newSelected);
                alert(`Importados ${rows.length} linhas para a seleção.`);
            },
            error(e) { alert("Erro ao importar CSV: " + e.message); }
        });
    };

    /* ------------------ PDF generation (A4 list and team 4-per-page) ------------------ */

    // CMV Minimalist A4 list
    const generatePDF = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const margin = 35;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxWidth = pageWidth - margin * 2;

        let y = margin;

        // Cabeçalho CMV
        y += 12;
        doc.setDrawColor(199, 126, 74);
        doc.line(margin, y, pageWidth - margin, y);
        y += 14;

        doc.setFont("times", "bold");
        doc.setFontSize(20);

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

        // Corpo – lista litúrgica
        const flat = flattenSelected(selectedSongs, sections);

        doc.setFont("times", "bold");
        doc.setFontSize(14);

        for (const item of flat) {
            const line = `${item.section}`;
            const canto = `${item.numero ? item.numero + " — " : ""}${item.nome}`;

            // Título da seção
            doc.setFont("times", "bold");
            doc.setFontSize(13);
            const sectionLines = doc.splitTextToSize(line, maxWidth);
            doc.text(sectionLines, margin, y);
            y += sectionLines.length * 16;

            // Nome do canto
            doc.setFont("times", "normal");
            doc.setFontSize(12);
            const cantoLines = doc.splitTextToSize(canto, maxWidth);
            doc.text(cantoLines, margin + 10, y);
            y += cantoLines.length * 14;

            // Compositor
            if (item.composer) {
                doc.setFont("times", "italic");
                doc.setFontSize(10);
                const compLine = doc.splitTextToSize(`Compositor: ${item.composer}`, maxWidth);
                doc.text(compLine, margin + 10, y);
                y += compLine.length * 12;
            }

            y += 12;

            // Próxima página?
            if (y > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = margin;
            }
        }

        const filename = `${(massName || "missal").replace(/\s+/g, "_")}_${massDate}.pdf`;
        doc.save(filename);
    };

    // Team PDF: 4 copies per A4 page
    const generateTeamPDF = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 30;

        const colWidth = (pageWidth - margin * 2) / 2;
        const rowHeight = (pageHeight - margin * 2) / 2;

        const flat = flattenSelected(selectedSongs, sections);

        const linesFull = flat.map((it) => ({
            section: it.section,
            canto: `${it.numero ? it.numero + " — " : ""}${it.nome}`
        }));

        const quadrants = [
            { x: margin, y: margin },
            { x: margin + colWidth, y: margin },
            { x: margin, y: margin + rowHeight },
            { x: margin + colWidth, y: margin + rowHeight },
        ];

        doc.setFont("times", "normal");
        doc.setFontSize(11);

        quadrants.forEach((pos) => {
            // Borda discreta
            doc.setDrawColor(199, 126, 74); // dourado CMV
            doc.rect(pos.x, pos.y, colWidth - 8, rowHeight - 8);

            const textX = pos.x + 12;
            let y = pos.y + 24;

            // Cabeçalho
            doc.setFont("times", "bold");
            doc.setFontSize(13);
            doc.text(massName || "Planejador de Missas", textX, y);
            y += 16;

            doc.setFont("times", "italic");
            doc.setFontSize(10);
            doc.text(`Data: ${massDate}`, textX, y);
            y += 14;

            doc.setDrawColor(199, 126, 74);
            doc.line(textX, y, textX + colWidth - 40, y);
            y += 14;

            // Conteúdo
            doc.setFont("times", "normal");
            linesFull.forEach((entry) => {
                // Seção (momento litúrgico)
                doc.setFont("times", "bold");
                doc.setFontSize(11);
                const secLines = doc.splitTextToSize(entry.section.toUpperCase(), colWidth - 40);
                doc.text(secLines, textX, y);
                y += secLines.length * 12;

                // Canto (número + nome)
                doc.setFont("times", "normal");
                doc.setFontSize(11);
                const cantoLines = doc.splitTextToSize(entry.canto, colWidth - 40);
                doc.text(cantoLines, textX, y);
                y += cantoLines.length * 12;

                // Espaço extra entre itens
                y += 8;
            });
        });

        const filename = `${(massName || "missal").replace(/\s+/g, "_")}_equipe_${massDate}.pdf`;
        doc.save(filename);
    };

    /* ------------------ Import/Export JSON (mantive) ------------------ */

    const importJSON = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                setMassName(parsed.missa || "");
                setMassDate(parsed.data || "");
                if (parsed.cantos && typeof parsed.cantos === "object") setSelectedSongs(parsed.cantos);
                alert("Arquivo JSON importado.");
            } catch {
                alert("Arquivo JSON inválido.");
            }
        };
        reader.readAsText(file, "utf-8");
    };

    const exportJSON = () => {
        const payload = { missa: massName, data: massDate, cantos: selectedSongs };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        downloadBlob(blob, `${(massName || "missal").replace(/\s+/g, "_")}_${massDate}.json`);
    };

    /* ------------------ UI ------------------ */

    return (
        <>
            <Header />

            <div className="min-h-screen p-6" style={{ background: "var(--cmv-bg, #f1e5ae)", color: "var(--cmv-text, #222)", fontFamily: "var(--font-sans, system-ui)" }}>
                <div className="max-w-6xl mx-auto mb-6">
                    <input type="text" placeholder="Nome da Missa" value={massName} onChange={(e) => setMassName(e.target.value)}
                        className="w-full p-4 text-2xl font-bold rounded-xl shadow-sm cmv-border"
                        style={{ background: "white", color: "var(--cmv-text)", fontFamily: "var(--font-heading)" }} />

                    <div className="mt-3">
                        <label className="text-sm mb-1 block" style={{ color: "var(--cmv-muted)" }}>Inserir Data</label>
                        <input type="date" value={massDate} onChange={(e) => setMassDate(e.target.value)} className="p-2 rounded" style={{ background: "white", border: "1px solid var(--cmv-primary)", color: "var(--cmv-text)" }} />
                    </div>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <div className="p-4 rounded-xl shadow-md cmv-border" style={{ background: "white" }}>

                            {/* Barra principal reorganizada */}
                            <div className="w-full flex flex-wrap items-center gap-4 mb-6">

                                <div className="relative inline-block">
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-5 py-2 rounded-xl font-semibold btn-cmv-outline"
                                        onMouseEnter={() => setTooltip('add')}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        Novo Canto
                                    </button>

                                    {tooltip === 'add' && (
                                        <div
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 tooltip-cmv z-50"
                                            style={{ transform: "translateX(-50%)" }}
                                        >
                                            Adicionar um novo canto à biblioteca
                                        </div>
                                    )}
                                </div>

                                <Tooltip text="Importar lista de cantos salva (.json)">
                                    <label className="px-5 py-2 rounded-xl cursor-pointer font-semibold btn-cmv-outline">
                                        Importar lista de cantos salva
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => importJSON(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </Tooltip>

                                <Tooltip text="Ajustes do programa">
                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className="px-5 py-2 rounded-xl font-semibold btn-cmv-outline"
                                    >
                                        ⚙️ Configurações
                                    </button>
                                </Tooltip>
                            </div>

                            <Filters globalSearch={globalSearch} setGlobalSearch={setGlobalSearch}
                                filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                                filterComposer={filterComposer} setFilterComposer={setFilterComposer}
                                sortMode={sortMode} setSortMode={setSortMode}
                                categoriesList={categoriesList} />

                            <div className="mt-4">
                                <LibraryPanel songs={filteredSongs} onAdd={handleLibraryAdd} onEdit={handleLibraryEdit} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <SelectedSongsPanel selectedSongs={selectedSongs} sections={sections} onRemove={({ section, indexInSection }) => removeFromSection(section, indexInSection ?? null)} onEdit={({ section, indexInSection }) => openEditSelectedItem(section, indexInSection)} />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Tooltip text="Exportar missa como JSON">
                                <button onClick={exportJSON} className="px-3 py-2 rounded btn-cmv-outline">Export .json</button>
                            </Tooltip>

                            <Tooltip text="Gerar PDF A4 (lista)">
                                <button onClick={generatePDF} className="px-3 py-2 rounded btn-cmv-outline">Gerar PDF</button>
                            </Tooltip>

                            <Tooltip text="Gerar PDF para equipe (4 por página)">
                                <button onClick={generateTeamPDF} className="px-3 py-2 rounded btn-cmv-outline">PDF Equipe</button>
                            </Tooltip>
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

                        <h2 className="h-liturgico mb-4"
                            style={{ fontSize: "1.6rem" }}>
                            ⚙️ Configurações
                        </h2>

                        <div className="space-y-3">

                            <Tooltip text="Importar biblioteca CSV">
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
                            </Tooltip>

                            <Tooltip text="Exportar biblioteca CSV">
                                <button
                                    onClick={exportLibraryAsCSV}
                                    className="px-4 py-2 rounded-xl btn-cmv-outline w-full">
                                    Exportar CSV — Biblioteca
                                </button>
                            </Tooltip>

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


            <ModalAddSong visible={showAddModal} onClose={() => setShowAddModal(false)} draft={newSongDraft} setDraft={setNewSongDraft} onSave={saveNewSong} />
            <ModalSelectSections visible={showSectionModal} pendingSong={pendingSong} sections={sections} pendingSelections={pendingSelections} setPendingSelections={setPendingSelections} onConfirm={confirmSectionSelection} onClose={() => setShowSectionModal(false)} />
        </>
    );
}
