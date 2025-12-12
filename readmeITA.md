# Missal Planner

Applicazione semplice e minimale per organizzare i canti liturgici per la Messa e per l'Adorazione Eucaristica, e per proiettarne il testo durante le celebrazioni.

## 📘 Panoramica
Missal Planner è uno strumento leggero e pratico, pensato per équipe liturgiche, musicisti, missionari e animatori del canto che desiderano preparare le celebrazioni in modo rapido, chiaro e ordinato.

## ✨ Funzionalità principali
- Creare liste di canti liturgici
- Modificare e riordinare i brani
- Salvare e riaprire celebrazioni già preparate
- Esportare schede pulite in PDF
- Condividere tramite file o link
- Proiezione dei testi dei canti con:
	zoom,
	navigazione per pagine,
	gestione intuitiva della “moldura” del testo,
	supporto multi-monitor,
	modalità schermo intero e finestra con bordi
	Interfaccia semplice, chiara e senza distrazioni

## 📂 Struttura del Progetto
```
missal-planner/
├─ public/
├─ src/
│  ├─ components/
│  ├─ pages/
│  ├─ data/
│  ├─ App.jsx
│  └─ ...
├─ electron/
│  ├─ main.cjs
│  ├─ preload.js
│  └─ ...
├─ package.json
└─ ...
```
## ▶️ Come Eseguire
Requisiti
Node.js 18+ (raccomandato 20)

Installazionenpm install
```
Avvia il server di sviluppo:
```
npm run dev
```
Apri il browser all'indirizzo:
```
http://localhost:5173
```

## 🚀 Roadmap
Funzionalità previste nelle prossime versioni:
- Importazione di file JSON
- Esportazione PDF con layout pulito
- Link condivisibili
- Ricerca interna
- Filtri per nome e numero
- Opzioni di ordinamento
- Modalità "Adorazione"
- Editor dei canti
- Interfaccia moderna con Tailwind

## 🤝 Contributi
I contributi sono benvenuti!
- Per nuove funzionalità, apri una *issue*
- Per miglioramenti, invia una *pull request*

## 👤 Crediti
Sviluppato da **Marco Cadeddu**.
Supportato dalla comunità open source.

## 📄 Licenza
Distribuito sotto licenza **MIT License**.