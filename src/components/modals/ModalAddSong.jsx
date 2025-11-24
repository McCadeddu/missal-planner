import React from "react";

/**
 * ModalAddSong - interface mínima para adicionar canto (controlled via props)
 */
export default function ModalAddSong({ visible, onClose, draft, setDraft, onSave }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="p-4 rounded-xl shadow-xl max-w-md w-full animate-fade cmv-border" style={{ background: "white" }}>
        <h3 className="font-semibold mb-2" style={{ color: "var(--cmv-text)" }}>Adicionar novo canto</h3>

        <label>Nome</label>
        <input value={draft.nome} onChange={(e) => setDraft(d => ({ ...d, nome: e.target.value }))} className="w-full p-2 rounded mb-2 cmv-border" style={{ background: "white" }} />

        <label>Número</label>
        <input value={draft.numero} onChange={(e) => setDraft(d => ({ ...d, numero: e.target.value }))} className="w-full p-2 rounded mb-2 cmv-border" style={{ background: "white" }} />

        <label>Compositor</label>
        <input value={draft.composer} onChange={(e) => setDraft(d => ({ ...d, composer: e.target.value }))} className="w-full p-2 rounded mb-2 cmv-border" style={{ background: "white" }} />

        <label>Categoria</label>
        <input value={draft.category} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))} className="w-full p-2 rounded mb-2 cmv-border" style={{ background: "white" }} />

        <div className="flex justify-end gap-2 mt-2">
          <button onClick={onClose} className="px-3 py-2 rounded btn-cmv-outline">Cancelar</button>
          <button onClick={onSave} className="px-3 py-2 rounded btn-cmv-outline">Salvar</button>
        </div>
      </div>
    </div>
  );
}
