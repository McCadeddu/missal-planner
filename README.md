# Missal-Planner

Aplicativo open-source para criar listas de canto litúrgico e projetar textos durante a missa.

**Missal-Planner** é um projeto comunitário sob MIT License.  
O objetivo é facilitar a organização das celebrações, impressão de listas e projeção de cantos.

---

## ✨ Funcionalidades

- Gerador de listas de canto (PDF / JSON)
- Projeção de textos litúrgicos com controle avançado de moldura
- Biblioteca multilingue de cânticos
- Suporte a múltiplos monitores e tela cheia (Electron)
- Exportação para AppImage / deb / exe / dmg (via electron-builder)

---

## 🛠️ Desenvolvimento

### Pré-requisitos

- **Node.js 18+** (recomendado: Node 20)
- npm
- Linux • Windows • macOS

---

## ▶️ Rodar em modo desenvolvimento

```bash
git clone https://github.com/McCadeddu/missal-planner.git
cd missal-planner
npm install
npm run dev
```

Depois acesse:

```
http://localhost:5173
```

Para rodar Electron em modo desenvolvimento:

```bash
npm run dev-electron
```

---

## 🌐 Línguas / Languages / Lingue

- 🇧🇷 [Versão em Português](README.md)
- 🇬🇧 [English Version](README.en.md)
- 🇮🇹 [Versione in Italiano](README.it.md)

> *(Garanta que os arquivos README.en.md e README.it.md estejam presentes.)*

---

## 📘 Visão Geral

O **Missal Planner** é uma ferramenta simples, leve e prática destinada a equipes de liturgia, ministros de música e missionários que precisam preparar celebrações com rapidez.

Ele permite:

- Criar listas de cantos
- Organizar e editar músicas
- Gerar listas em **PDF**
- Compartilhar arquivos
- Projetar cantos ao vivo em tela cheia
- Controlar moldura, zoom, navegação e tela cheia pelo painel do operador

Interface limpa, objetiva e pensada para uso pastoral.

---

## 📂 Estrutura do Projeto

```
missal-planner/
├─ public/
├─ src/
│  ├─ components/
│  ├─ data/
│  ├─ pages/
│  ├─ App.jsx
│  └─ ...
├─ electron/
│  ├─ main.cjs
│  ├─ preload.js
│  └─ ...
├─ package.json
└─ build/
```

---

## 🖥️ Build dos Aplicativos (Windows / Linux / macOS)

Gere a build do frontend:

```bash
npm run build
```

Gere os instaladores para todas as plataformas (*no sistema operacional correspondente*):

### Windows
```bash
npm run dist:win
```

### Linux
```bash
npm run dist:linux
```

### macOS
```bash
npm run dist:mac
```

Saída será salva em:

```
release/
```

---

## 🚀 Roadmap (próximas funcionalidades)

- Importação automática de JSON e arquivos externos
- Editor avançado de cânticos
- Modo "Adoração" para projeção contínua
- Busca avançada por número, título ou trecho
- Interface modernizada com transições
- Exportação e backup de listas na nuvem

---

## 🤝 Como Contribuir

Contribuições são bem-vindas!

- Abra uma **issue** para novas funcionalidades
- Envie um **pull request** com melhorias
- Sugira ideias na aba **Discussions**

---

## 🛠 Tecnologias Utilizadas

- **React + Vite**
- **Electron 39**
- **Tailwind CSS**
- **html2pdf.js**
- **Express (servidor interno opcional)**
- **Electron Builder**

---

## 🖼 Capturas de Tela
(*adicione quando quiser*)

- Tela inicial  
- Painel do Operador  
- Projeção em Tela Cheia  
- Editor de texto dos cantos  
- Lista gerada em PDF  

---

## 👤 Créditos

Projeto desenvolvido por **Marco Cadeddu**  
Apoio técnico: **Comunidade Open Source**

---

EOF
