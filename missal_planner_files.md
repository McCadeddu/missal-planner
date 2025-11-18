# Estrutura Final do Projeto

```
missal-planner/
├── public/
├── src/
│   ├── components/
│   │   ├── SongSelector.jsx
│   │   └── SongList.jsx
│   ├── data/
│   │   └── songs.json
│   ├── App.jsx
│   └── index.js
├── package.json
└── ...
```

---

# **SongSelector.jsx**

```jsx
import React, { useState } from "react";

function SongSelector({ songs, onSelect }) {
  const [section, setSection] = useState("entrada");
  const [manualNumber, setManualNumber] = useState("");
  const [manualName, setManualName] = useState("");

  const handleChoose = (song) => {
    onSelect(section, song);
  };

  const handleAddManual = () => {
    if (!manualNumber || !manualName) return;

    const newSong = {
      numero: manualNumber,
      nome: manualName,
      categoria: section,
    };

    onSelect(section, newSong);

    setManualNumber("");
    setManualName("");
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Selecionar Cantos</h2>

      <label className="block text-sm font-medium">Escolher seção:</label>
      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className="mb-4 p-2 w-full border rounded-lg"
      >
        <option value="entrada">Entrada</option>
        <option value="atoPenitencial">Ato Penitencial</option>
        <option value="gloria">Glória</option>
        <option value="salmo">Salmo</option>
        <option value="aclamacao">Aclamação</option>
        <option value="ofertorio">Ofertório</option>
        <option value="santo">Santo</option>
        <option value="cordeiro">Cordeiro</option>
        <option value="comunhao">Comunhão</option>
        <option value="final">Final</option>
      </select>

      <div className="mb-6">
        <label className="block font-medium text-sm">Buscar canto na lista:</label>
        <div className="max-h-40 overflow-y-auto border p-2 rounded-lg bg-gray-50">
          {songs
            .sort((a, b) => a.numero - b.numero)
            .map((song) => (
              <div
                key={song.numero}
                className="cursor-pointer p-2 hover:bg-gray-200 rounded"
                onClick={() => handleChoose(song)}
              >
                {song.numero} - {song.nome}
              </div>
            ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Adicionar canto manualmente</h3>

        <input
          type="text"
          placeholder="Número"
          className="p-2 border rounded w-full mb-2"
          value={manualNumber}
          onChange={(e) => setManualNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Nome do canto"
          className="p-2 border rounded w-full mb-2"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
        />

        <button
          onClick={handleAddManual}
          className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

export default SongSelector;
```

---

# **SongList.jsx**

```jsx
import React from "react";

function SongList({ selectedSongs }) {
  const sections = [
    { key: "entrada", label: "Entrada" },
    { key: "atoPenitencial", label: "Ato Penitencial" },
    { key: "gloria", label: "Glória" },
    { key: "salmo", label: "Salmo" },
    { key: "aclamacao", label: "Aclamação" },
    { key: "ofertorio", label: "Ofertório" },
    { key: "santo", label: "Santo" },
    { key: "cordeiro", label: "Cordeiro" },
    { key: "comunhao", label: "Comunhão" },
    { key: "final", label: "Final" },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Cantos Escolhidos</h2>

      {sections.map(({ key, label }) => (
        <div key={key} className="mb-3">
          <h3 className="font-semibold">{label}</h3>
          <p className="text-gray-700">
            {selectedSongs[key]
              ? `${selectedSongs[key].numero} - ${selectedSongs[key].nome}`
              : "(nenhum canto escolhido)"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default SongList;
```

---

Se quiser, posso incluir também:
- `App.jsx` completo atualizado
- Uma versão nova de `songs.json`
- O CSS do Tailwind configurado
- Arquivo para exportar PDF

É só pedir!

