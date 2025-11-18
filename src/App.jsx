import React, { useState, useEffect } from "react";
import SongSelector from "./components/SongSelector";
import SongList from "./components/SongList";
import Papa from "papaparse";
import html2pdf from "html2pdf.js";
import cantosCSV from "./data/cantos.csv?raw";

const sections = [
    "Ensaio de canto",
    "Canto de Entrada ou Hino da LDH",
    "Canto Penitencial",
    "Glória",
    "Salmo",
    "Aclamação ao Evangelho",
    "Refrão para rezar a Palavra",
    "Canto de Ofertório",
    "Santo cantado",
    "Cordeiro de Deus cantado",
    "Canto de Comunhão",
    "Canto de Ação de Graças",
    "Canto final da celebração",
    "Canto de Adoração ao Santíssimo",
    "Canto de Louvor",
    "Canto de Intercessão",
    "Canto final da Adoração"
];

function App() {
    const [songsData, setSongsData] = useState([]);
    const [selectedSongs, setSelectedSongs] = useState({});
    const [massName, setMassName] = useState("");
    const [massDate, setMassDate] = useState("");

    const [newSongName, setNewSongName] = useState("");
    const [newSongNumber, setNewSongNumber] = useState("");

    // Ler CSV
    useEffect(() => {
        const parsed = Papa.parse(cantosCSV, { header: true });
        const data = parsed.data
            .map(row => ({ nome: row["NOME DO CANTO"], numero: row["NÚMERO"] }))
            .filter(row => row.nome);
        setSongsData(data);
    }, []);

    // Adicionar novo canto
    const handleAddSong = () => {
        if (!newSongName.trim() || !newSongNumber.trim()) {
            alert("Preencha nome e número do canto.");
            return;
        }
        const newSong = { nome: newSongName, numero: newSongNumber };
        setSongsData(prev => [...prev, newSong]);
        setNewSongName("");
        setNewSongNumber("");
    };

    // Selecionar ou limpar canto
    const handleSongSelect = (section, song) => {
        if (!song) {
            setSelectedSongs(prev => {
                const copy = { ...prev };
                delete copy[section];
                return copy;
            });
        } else {
            setSelectedSongs(prev => ({ ...prev, [section]: song }));
        }
    };

    // Salvar JSON
    const handleSave = () => {
        const data = { missa: massName, data: massDate, cantos: selectedSongs };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${massName || "missal"}-lista.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Carregar missal via link compartilhado (?data=...)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get("data");

        if (encoded) {
            try {
                const decodedObj = JSON.parse(
                    atob(decodeURIComponent(encoded))
                );

                setMassName(decodedObj.missa || "");
                setMassDate(decodedObj.data || "");
                setSelectedSongs(decodedObj.cantos || {});
            } catch (e) {
                console.error("Falha ao carregar link:", e);
            }
        }
    }, []);


    // Compartilhar JSON
    const handleShare = () => {
        const data = { missa: massName, data: massDate, cantos: selectedSongs };
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            .then(() => alert("Conteúdo copiado para a área de transferência!"))
            .catch(() => alert("Falha ao copiar."));
    };

    // Imprimir
    const handlePrint = () => {
        const printContent = document.getElementById("printable");
        const newWindow = window.open("", "", "width=800,height=600");
        newWindow.document.write(
            `<html><head><title>Lista de Cantos</title></head><body>${printContent.innerHTML}</body></html>`
        );
        newWindow.document.close();
        newWindow.print();
    };

    // Exportar PDF
    const handleExportPDF = () => {
        const element = document.getElementById("printable");

        const wrapper = document.createElement("div");
        const title = document.createElement("h1");
        title.textContent = massName || "Lista de Cantos";
        title.style.textAlign = "center";
        title.style.fontSize = "24px";
        title.style.marginBottom = "4px";

        const subtitle = document.createElement("h2");
        // Converte data para dd/mm/aaaa
        const formattedDate = massDate ? new Date(massDate).toLocaleDateString("pt-BR") : "";
        subtitle.textContent = formattedDate;
        subtitle.style.textAlign = "center";
        subtitle.style.fontSize = "18px";
        subtitle.style.marginBottom = "12px";

        wrapper.appendChild(title);
        wrapper.appendChild(subtitle);
        wrapper.appendChild(element.cloneNode(true));

        const opt = {
            margin: 0.5,
            filename: `${massName || "missal"}-lista.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(wrapper).save();
    };

    // Gerar link de compartilhamento
    const handleShareLink = () => {
        const payload = {
            missa: massName,
            data: massDate,
            cantos: selectedSongs
        };

        try {
            const encoded = encodeURIComponent(
                btoa(JSON.stringify(payload))
            );

            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

            navigator.clipboard.writeText(shareUrl)
                .then(() => alert("Link copiado para a área de transferência!"))
                .catch(() => prompt("Copie o link abaixo:", shareUrl));
        } catch (e) {
            alert("Erro ao gerar o link.");
        }
    };


    // Abrir JSON
    const handleJsonUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                setMassName(parsed.missa || "");
                setMassDate(parsed.data || "");
                setSelectedSongs(parsed.cantos || {});
                alert("Arquivo carregado com sucesso!");
            } catch {
                alert("Erro ao ler o arquivo JSON.");
            }
        };
        reader.onerror = () => alert("Falha ao ler o arquivo.");
        reader.readAsText(file, "utf-8");
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold mb-6">Planejador de Missais</h1>

            {/* Informações da Missa */}
            <div className="p-4 bg-white shadow rounded-xl mb-6">
                <h2 className="text-xl font-semibold mb-4">Informações da Missa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Nome da Missa"
                        value={massName}
                        onChange={(e) => setMassName(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="date"
                        value={massDate}
                        onChange={(e) => setMassDate(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>

            {/* Adicionar novo canto */}
            <div className="p-4 bg-white shadow rounded-xl mb-6">
                <h2 className="text-xl font-semibold mb-4">Adicionar Novo Canto</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Nome do Canto"
                        value={newSongName}
                        onChange={(e) => setNewSongName(e.target.value)}
                        className="p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Número"
                        value={newSongNumber}
                        onChange={(e) => setNewSongNumber(e.target.value)}
                        className="p-2 border rounded"
                    />
                    <button
                        onClick={handleAddSong}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        Adicionar canto
                    </button>
                </div>
            </div>

            {/* Selecionar Cantos */}
            <div className="p-4 bg-white shadow rounded-xl mb-6">
                <h2 className="text-xl font-semibold mb-4">Selecionar Cantos</h2>
                {sections.map(section => (
                    <SongSelector
                        key={section}
                        section={section}
                        songs={songsData}
                        selectedSong={selectedSongs[section] || null}
                        onSelect={(song) => handleSongSelect(section, song)}
                        allowClear={true} // permite limpar
                    />
                ))}
            </div>

            {/* Lista Selecionada */}
            <div id="printable" className="p-4 bg-white shadow rounded-xl mb-6">
                <h2 className="text-xl font-semibold mb-4">Cantos Selecionados</h2>
                <SongList selectedSongs={selectedSongs} sections={sections} />
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-4">
                <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded">Salvar Lista</button>
                <button onClick={handleShare} className="px-6 py-3 bg-blue-600 text-white rounded">Compartilhar</button>
                <button onClick={handlePrint} className="px-6 py-3 bg-gray-600 text-white rounded">Imprimir</button>
                <button onClick={handleExportPDF} className="px-6 py-3 bg-red-600 text-white rounded">Exportar PDF</button>
                <button
                    onClick={handleShareLink}
                    className="px-6 py-3 bg-indigo-600 text-white rounded"
                >
                    Compartilhar por link
                </button>

                <label className="px-6 py-3 bg-purple-600 text-white rounded cursor-pointer">
                    Abrir Lista
                    <input type="file" accept=".json" className="hidden" onChange={(e) => handleJsonUpload(e.target.files[0])} />
                </label>
            </div>
        </div>
    );
}

export default App;
