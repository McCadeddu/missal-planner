import React from "react";

/**
 * ModalSelectSections - escolher seções ao adicionar um canto
 */
export default function ModalSelectSections({ visible, pendingSong, sections, pendingSelections, setPendingSelections, onConfirm, onClose }) {
  if (!visible || !pendingSong) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="p-4 rounded-xl shadow-xl max-w-md w-full animate-fade cmv-border" style={{ background: "white" }}>
        <h3 className="font-semibold mb-3" style={{ color: "var(--cmv-text)" }}>Adicionar "{pendingSong.nome}"</h3>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {sections.map((sec) => (
            <label key={sec} className="p-2 rounded bg-white cmv-border">
              <input type="checkbox" checked={!!pendingSelections[sec]} onChange={(e) => setPendingSelections(prev => ({ ...prev, [sec]: e.target.checked }))} />
              <span className="ml-2">{sec}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-2 rounded btn-cmv-outline">Cancelar</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded btn-cmv-outline">Confirmar</button>
        </div>
      </div>
    </div>
  );
}
