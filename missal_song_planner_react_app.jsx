import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

// MissalSongPlanner
// Single-file React component (Tailwind-ready) that lets the user:
// - Upload a CSV (exported from Excel) with two columns: name, number
// - Choose which moments (1-17) to include in the celebration
// - Assign songs (by number) to each chosen moment
// - Generate a printable/shareable list (print dialog / download CSV)
// - Save/load from localStorage

const MOMENTS = [
  { id: 1, label: "Ensaio de canto" },
  { id: 2, label: "Canto de Entrada / Hino da LDH" },
  { id: 3, label: "Canto Penitencial" },
  { id: 4, label: "Glória" },
  { id: 5, label: "Salmo" },
  { id: 6, label: "Aclamação ao Evangelho" },
  { id: 7, label: "Refrão para rezar a Palavra" },
  { id: 8, label: "Canto de Ofertório" },
  { id: 9, label: "Santo cantado" },
  { id: 10, label: "Cordeiro de Deus cantado" },
  { id: 11, label: "Canto de Comunhão" },
  { id: 12, label: "Canto de Ação de Graças" },
  { id: 13, label: "Canto final da celebração" },
  { id: 14, label: "Canto de Adoração ao Santíssimo" },
  { id: 15, label: "Canto de Louvor" },
  { id: 16, label: "Canto de Intercessão" },
  { id: 17, label: "Canto final da Adoração" },
];

export default function MissalSongPlanner() {
  const [songs, setSongs] = useState([]); // {name, number}
  const [selectedMoments, setSelectedMoments] = useState([]); // moment ids
  const [assignments, setAssignments] = useState({}); // {momentId: {name,number}}
  const [filter, setFilter] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    // load saved state if exists
    const saved = localStorage.getItem("missalPlanner:v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSongs(parsed.songs || []);
        setSelectedMoments(parsed.selectedMoments || []);
        setAssignments(parsed.assignments || {});
      } catch (e) {
        console.warn("Could not parse saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    const payload = { songs, selectedMoments, assignments };
    localStorage.setItem("missalPlanner:v1", JSON.stringify(payload));
  }, [songs, selectedMoments, assignments]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        // Expect two columns: name, number (in either order). We'll try to guess.
        const rows = results.data.map((r) => {
          // r can be an array or object
          if (Array.isArray(r)) {
            const name = r[0] ? String(r[0]).trim() : "";
            const number = r[1] ? String(r[1]).trim() : "";
            return { name, number };
          } else {
            // object fallback
            const vals = Object.values(r);
            return { name: String(vals[0] || "").trim(), number: String(vals[1] || "").trim() };
          }
        });
        setSongs(rows.filter((s) => s.name || s.number));
      },
      error: (err) => alert("Erro ao ler o ficheiro: " + err.message),
    });
  }

  function toggleMoment(id) {
    setSelectedMoments((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function assignSongToMoment(momentId, songNumber) {
    const song = songs.find((s) => s.number === songNumber || s.name === songNumber);
    const assignment = song ? { ...song } : { name: songNumber ? `#${songNumber}` : "", number: songNumber };
    setAssignments((prev) => ({ ...prev, [momentId]: assignment }));
  }

  function clearAssignments() {
    if (!confirm("Limpar todas as atribuições?")) return;
    setAssignments({});
  }

  function downloadCSV() {
    const rows = selectedMoments.map((id) => {
      const m = MOMENTS.find((x) => x.id === id);
      const a = assignments[id] || { name: "", number: "" };
      return [String(id), m.label, a.name, a.number];
    });
    const csv = Papa.unparse({ fields: ["momentId", "momentLabel", "songName", "songNumber"], data: rows });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "liste_cantos_missa.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPrintable() {
    // open a new window with a printable HTML
    const rowsHtml = selectedMoments
      .map((id) => {
        const m = MOMENTS.find((x) => x.id === id);
        const a = assignments[id] || { name: "", number: "" };
        return `<tr><td style='padding:6px; border:1px solid #ddd'>${id}</td><td style='padding:6px; border:1px solid #ddd'>${escapeHtml(
          m.label
        )}</td><td style='padding:6px; border:1px solid #ddd'>${escapeHtml(a.name || "")}</td><td style='padding:6px; border:1px solid #ddd'>${
          escapeHtml(a.number || "")
        }</td></tr>`;
      })
      .join("\n");

    const html = `
      <html>
      <head>
        <title>Lista de Cantos</title>
        <meta charset='utf-8' />
      </head>
      <body>
        <h2>Lista de Cantos para a Celebração</h2>
        <table style='border-collapse:collapse; width:100%;'>
          <thead>
            <tr><th style='padding:6px; border:1px solid #ddd'>#</th><th style='padding:6px; border:1px solid #ddd'>Momento</th><th style='padding:6px; border:1px solid #ddd'>Canto</th><th style='padding:6px; border:1px solid #ddd'>Número</th></tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Pop-up bloqueado. Permita pop-ups ou use a opção 'Imprimir' do navegador.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>\"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function removeSong(number) {
    if (!confirm(`Remover o canto com número ${number}?`)) return;
    setSongs((prev) => prev.filter((s) => s.number !== number));
  }

  function addManualSong() {
    const name = prompt("Nome do canto:");
    if (!name) return;
    const number = prompt("Número do canto (opcional):");
    setSongs((prev) => [...prev, { name: name.trim(), number: number ? number.trim() : "" }]);
  }

  const visibleSongs = songs.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()) || s.number.includes(filter));

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Missal Song Planner</h1>
      <p className="mb-3">Carregue aqui o seu ficheiro CSV (exportado do Excel): duas colunas — nome do canto | número</p>
      <div className="flex gap-2 items-center mb-4">
        <input ref={fileInputRef} onChange={handleFile} type="file" accept=".csv,text/csv" className="p-2 border rounded" />
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 rounded bg-sky-500 text-white">Selecionar ficheiro</button>
        <button onClick={() => { setSongs([]); localStorage.removeItem('missalPlanner:v1'); }} className="px-3 py-2 rounded border">Limpar ficheiro</button>
        <button onClick={addManualSong} className="px-3 py-2 rounded border">Adicionar canto manualmente</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 border rounded">
          <h2 className="font-semibold mb-2">Momentos da celebração</h2>
          <div className="space-y-2 max-h-72 overflow-auto">
            {MOMENTS.map((m) => (
              <label key={m.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedMoments.includes(m.id)} onChange={() => toggleMoment(m.id)} />
                <span className="text-sm">{m.id}. {m.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setSelectedMoments(MOMENTS.map(m=>m.id))} className="px-3 py-1 rounded border">Selecionar tudo</button>
            <button onClick={() => setSelectedMoments([])} className="px-3 py-1 rounded border">Desmarcar tudo</button>
          </div>
        </div>

        <div className="p-3 border rounded col-span-2">
          <h2 className="font-semibold mb-2">Lista de cantos ({songs.length})</h2>
          <div className="flex gap-2 mb-3">
            <input placeholder="Pesquisar nome ou número" value={filter} onChange={(e)=>setFilter(e.target.value)} className="flex-1 p-2 border rounded" />
            <button onClick={()=>{ if(!songs.length) alert('Nenhum canto carregado.'); else downloadCSV(); }} className="px-3 py-2 rounded border">Exportar CSV</button>
          </div>
          <div className="max-h-64 overflow-auto">
            {visibleSongs.map((s, idx)=> (
              <div key={`${s.number}-${idx}`} className="flex justify-between items-center p-2 border-b">
                <div>
                  <div className="font-medium">{s.name || "(sem nome)"}</div>
                  <div className="text-sm text-muted">Nº: {s.number || '-'}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <select onChange={(e)=>{ /* assign the selected song to currently selected moment(s) */ }} value="">
                    <option value="">Atribuir a...</option>
                    {selectedMoments.map(id=> (
                      <option key={id} value={`${id}|${s.number}`}>{id} - {MOMENTS.find(m=>m.id===id).label}</option>
                    ))}
                  </select>
                  <button onClick={()=>{
                    // if user selected a single moment, assign directly; else prompt
                    if(selectedMoments.length===1){ assignSongToMoment(selectedMoments[0], s.number); }
                    else if(selectedMoments.length>1){ if(confirm('Atribuir a todos os momentos selecionados?')){ selectedMoments.forEach(id=>assignSongToMoment(id, s.number)); } }
                    else { alert('Selecione pelo menos um momento à esquerda para atribuir este canto.'); }
                  }} className="px-2 py-1 rounded border">Atribuir</button>
                  <button onClick={()=>removeSong(s.number)} className="px-2 py-1 rounded border">Remover</button>
                </div>
              </div>
            ))}
            {visibleSongs.length===0 && <div className="p-2 text-sm text-muted">Sem resultados.</div>}
          </div>
        </div>

        <div className="p-3 border rounded col-span-3">
          <h2 className="font-semibold mb-2">Atribuições e lista final</h2>
          <div className="space-y-2">
            {selectedMoments.length===0 && <div className="text-sm">Nenhum momento selecionado. Selecione momentos no painel à esquerda.</div>}
            {selectedMoments.sort((a,b)=>a-b).map(id=>{
              const m = MOMENTS.find(x=>x.id===id);
              const a = assignments[id] || { name: "", number: "" };
              return (
                <div key={id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-2 border rounded">
                  <div>
                    <div className="font-medium">{id}. {m.label}</div>
                    <div className="text-sm text-muted">{a.name ? `${a.name} — Nº ${a.number || '-'} ` : <em>Sem canto atribuído</em>}</div>
                  </div>
                  <div className="flex gap-2">
                    <select value={a.number || ""} onChange={(e)=>assignSongToMoment(id, e.target.value)} className="p-2 border rounded">
                      <option value="">(Escolher por número ou escrever)</option>
                      {songs.map(s=> <option key={s.number+"_"+s.name} value={s.number}>{s.number} — {s.name}</option>)}
                    </select>
                    <input placeholder="ou escrever o nome do canto" defaultValue={a.name} onBlur={(e)=> setAssignments(prev=> ({...prev, [id]: { name: e.target.value.trim(), number: prev[id]?.number || "" }}))} className="p-2 border rounded" />
                    <button onClick={()=> setAssignments(prev=>{ const copy={...prev}; delete copy[id]; return copy; })} className="px-3 py-1 rounded border">Remover</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={exportPrintable} className="px-4 py-2 rounded bg-green-600 text-white">Imprimir Lista</button>
            <button onClick={downloadCSV} className="px-4 py-2 rounded border">Exportar CSV</button>
            <button onClick={clearAssignments} className="px-4 py-2 rounded border">Limpar Atribuições</button>
            <button onClick={()=>{navigator.clipboard && navigator.clipboard.writeText(JSON.stringify({selectedMoments, assignments})); alert('Copiado para a área de transferência (formato JSON).'); }} className="px-4 py-2 rounded border">Copiar JSON</button>
          </div>
        </div>

      </div>
    </div>
  );
}
