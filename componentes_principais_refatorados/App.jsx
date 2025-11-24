import React, { useState, useEffect } from "react";
import Papa from "papaparse";

import Header from "./components/Header";
import Tooltip from "./components/Tooltip";

import LibraryPanel from "./components/library/LibraryPanel";
import Filters from "./components/library/Filters";
import SidebarPanel from "./components/sidebar/SidebarPanel";
import SelectedSongsPanel from "./components/selected/SelectedSongsPanel";
import ModalAddSong from "./components/modals/ModalAddSong";
import ModalSelectSections from "./components/modals/ModalSelectSections";

import cantosCSV from "./data/cantos.csv?raw";

/* modes and sections kept simple here (same as original) */
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

export default function App() {
  const [songsData, setSongsData] = useState([]);
  const [mode, setMode] = useState("missa");
  const [sections, setSections] = useState(modes[mode].sections);
  const [selectedSongs, setSelectedSongs] = useState({});

  const [massName, setMassName] = useState("");
  const [massDate, setMassDate] = useState(() => new Date().toISOString().slice(0,10));

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

  useEffect(() => {
    if (!cantosCSV) return;
    try {
      const parsed = Papa.parse(cantosCSV, { header: true, skipEmptyLines: true });
      const arr = parsed.data.map((r, idx) => {
        const nome = (r["NOME DO CANTO"] ?? r["NOME"] ?? r["Nome do Canto"] ?? r["nome"] ?? r["NOME_DO_CANTO"] ?? "").toString().trim();
        const numero = (r["NÚMERO"] ?? r["NUMERO"] ?? r["Número"] ?? r["numero"] ?? "").toString().trim();
        const category = (r["CATEGORIA"] ?? r["categoria"] ?? "Geral").toString().trim() || "Geral";
        const composer = (r["COMPOSER"] ?? r["COMPOSITOR"] ?? r["composer"] ?? "").toString().trim();
        return { id: idx+1, numero, nome, composer, category };
      }).filter(s => s.nome);
      setSongsData(arr);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setSections(modes[mode].sections);
    setSelectedSongs(prev => {
      const copy = { ...prev };
      for (const sec of Object.keys(copy)) {
        if (!modes[mode].sections.includes(sec)) delete copy[sec];
      }
      return copy;
    });
  }, [mode]);

  const filteredSongs = songsData.filter((s) => {
    if (filterCategory && filterCategory !== "Todas" && s.category !== filterCategory) return false;
    if (filterComposer && !s.composer.toLowerCase().includes(filterComposer.toLowerCase())) return false;
    if (globalSearch) {
      const q = globalSearch.toLowerCase();
      return (s.nome||"").toLowerCase().includes(q) || (s.numero||"").toLowerCase().includes(q) || (s.composer||"").toLowerCase().includes(q);
    }
    return true;
  }).sort((a,b) => {
    if (sortMode === "nome") return a.nome.localeCompare(b.nome);
    if (sortMode === "numero") return a.numero.localeCompare(b.numero);
    return 0;
  });

  const categoriesList = Array.from(new Set(["Geral", ...songsData.map(s => s.category)]));

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
    const chosen = Object.keys(pendingSelections).filter(k => pendingSelections[k]);
    if (chosen.length === 0) { alert("Escolha ao menos uma seção."); return; }

    setSelectedSongs(prev => {
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
    setSelectedSongs(prev => {
      const copy = { ...prev };
      if (!copy[section]) return copy;
      if (index === null) {
        delete copy[section];
      } else {
        const arr = [...copy[section]];
        arr.splice(index,1);
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
    if (!newSongDraft.nome || newSongDraft.nome.trim().length === 0) { alert('Nome vazio'); return; }
    setSongsData(prev => [...prev, { id: prev.length+1, ...newSongDraft }]);
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

  return (
    <>
      <Header />

      <div className="min-h-screen p-6" style={{ background: "var(--cmv-bg, #f1e5ae)", color: "var(--cmv-text, #222)", fontFamily: "var(--font-sans, system-ui)" }}>
        <div className="max-w-6xl mx-auto mb-6">
          <input type="text" placeholder="Nome da Missa" value={massName} onChange={e => setMassName(e.target.value)}
            className="w-full p-4 text-2xl font-bold rounded-xl shadow-sm cmv-border"
            style={{ background: "white", color: "var(--cmv-text)", fontFamily: "var(--font-heading)" }} />

          <div className="mt-3">
            <label className="text-sm mb-1 block" style={{ color: "var(--cmv-muted)" }}>Inserir Data</label>
            <input type="date" value={massDate} onChange={e => setMassDate(e.target.value)} className="p-2 rounded" style={{ background: "white", border: "1px solid var(--cmv-primary)", color: "var(--cmv-text)" }} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="p-4 rounded-xl shadow-md cmv-border" style={{ background: "white" }}>
              <div className="w-full flex flex-row items-center gap-6 mb-8">
                <div className="relative group">
                  <Tooltip text="Adicionar um novo canto à biblioteca">
                    <button onClick={() => setShowAddModal(true)} className="px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 btn-cmv-outline">Novo Canto</button>
                  </Tooltip>
                </div>

                <div className="relative group">
                  <Tooltip text="Importar missa salva em arquivo JSON">
                    <label className="px-6 py-3 rounded-xl cursor-pointer font-semibold shadow-lg transition-all duration-200 btn-cmv-outline">
                      Importar .json
                      <input type="file" accept="application/json" onChange={e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = evt => {
                          try {
                            const parsed = JSON.parse(evt.target.result);
                            setMassName(parsed.missa || "");
                            setMassDate(parsed.data || "");
                            if (parsed.cantos && typeof parsed.cantos === 'object') setSelectedSongs(parsed.cantos);
                            alert('Arquivo importado com sucesso!');
                          } catch {
                            alert('Arquivo inválido.');
                          }
                        };
                        reader.readAsText(f, 'utf-8');
                      }} className="hidden" />
                    </label>
                  </Tooltip>
                </div>
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
              <SelectedSongsPanel selectedSongs={selectedSongs} sections={sections} onRemove={({section, indexInSection}) => removeFromSection(section, indexInSection ?? null)} onEdit={({section, indexInSection}) => openEditSelectedItem(section, indexInSection)} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Tooltip text="Exportar missa como JSON"><button onClick={() => {
                const payload = { missa: massName, data: massDate, cantos: selectedSongs };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${(massName||'missal').replace(/\s+/g,'_')}_${massDate}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
              }} className="px-3 py-2 rounded btn-cmv-outline">Export .json</button></Tooltip>

              <Tooltip text="Gerar PDF litúrgico"><button onClick={() => alert('Gerar PDF (ainda usando função antiga)')} className="px-3 py-2 rounded btn-cmv-outline">Gerar PDF</button></Tooltip>
            </div>
          </div>

          <div className="col-span-1">
            <SidebarPanel mode={mode} setMode={setMode} modes={modes} sections={sections} categoriesList={categoriesList} setFilterCategory={setFilterCategory} setSelectedSongs={setSelectedSongs} />
          </div>
        </div>
      </div>

      <ModalAddSong visible={showAddModal} onClose={() => setShowAddModal(false)} draft={newSongDraft} setDraft={setNewSongDraft} onSave={saveNewSong} />
      <ModalSelectSections visible={showSectionModal} pendingSong={pendingSong} sections={sections} pendingSelections={pendingSelections} setPendingSelections={setPendingSelections} onConfirm={confirmSectionSelection} onClose={() => setShowSectionModal(false)} />
    </>
  );
}
