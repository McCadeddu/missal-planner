# Estrutura Final do Projeto

```
missal-planner/
├─ build/
│  ├─ icons/
│  │  ├─ icon.png
│  │  └─ icon.icns
├─ dist/
├─ electron/
│  ├─ main.cjs
│  ├─ preload.js
├─ public/
├─ release/
├─ src/
│  ├─ components/
│  │  ├─ Header.jsx
│  │  └─ [...]
│  ├─ pages/
│  │  ├─ OperatorView.jsx
│  │  ├─ ProjectionView.jsx
│  │  └─ Home.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ routes.jsx
│  └─ [...]
├─ package.json
├─ tailwind.config.js
├─ postcss.config.js
└─ README.md
```

---

📦 2. Pasta electron/
2.1 main.cjs — Processo Principal do Electron

Responsável por:

Criar as janelas:

Janela Principal

Painel do Operador

Janela de Projeção

Implementar sistema completo de:

Fullscreen

Alternância entre frameless ↔ com borda

Seleção de monitor

Recriação dinâmica da janela de projeção

Comunicação com o frontend via IPC:

Atualização de preview

Atualização de projeção ao vivo (live)

Toggle de overlay

Carregar/salvar textos dos cantos

Fluxos importantes dentro de main.cjs:

Operator → Projection:
Via IPC "operator-send-live" e "operator-set-preview".

Projeção multi-monitor:
IPC "projection-open-on-display" reposiciona e coloca fullscreen no monitor escolhido.

Toggle de borda da janela:
Recria janela com "frame: true" ou "frame: false".

2.2 preload.js — Bridge Segura (contextBridge)

Expõe APIs seguras ao frontend React:

missalAPI.openOnDisplay()

missalAPI.toggleFullscreen()

missalAPI.toggleBorder()

missalAPI.setPreview()

missalAPI.sendLive()

missalAPI.loadSongTextFromFile()

missalAPI.saveSongTextToFile()

missalAPI.getDisplays()

É a camada intermediária entre processo principal e frontend, garantindo segurança (sem nodeIntegration).

🎨 3. Pasta src/pages/
3.1 OperatorView.jsx — Painel do Operador

Este é o arquivo mais complexo da aplicação.

Funções principais:

Controle total da projeção

Moldura azul:

arrastável verticalmente

redimensionável pela borda inferior

independente por página

Zoom do texto com recalculação de paginação

Pré-visualização de:

página anterior

página atual (A4)

página seguinte

Sincronização Live com a janela de projeção

Seleção de monitor e controle de fullscreen/bordas

Editor do texto do canto

Botão “Voltar ao início”

Fluxos implementados:
1. Paginação dinâmica

Baseada em:

fontScale

altura da área A4

número de linhas

2. Molduras independentes

Guardadas em:

framesPerPage = { 0: { top, height }, 1: { ... } }

3. Preview e Live

Throttle por requestAnimationFrame.

4. Mini-prévia

Usuário pode ajustar molduras das páginas anterior e seguinte.

3.2 ProjectionView.jsx — Janela de Projeção
Função:

Renderizar apenas o texto projetado

Escalar fonte conforme fontScale

Respeitar viewportTop e viewportHeight enviados pelo Operador

Exibir ou ocultar overlay (fundo opaco)

Não possui controles

Apenas escuta IPC e atualiza a interface.

3.3 Home.jsx

Página inicial do WebApp.

🧩 4. Pasta src/components/
Exemplos de componentes:

Header.jsx — cabeçalho simples

Elementos auxiliares reutilizáveis

Esses componentes suportam a interface principal.

📄 5. Arquivos Principais do React
5.1 App.jsx

Define layout principal

Inclui rotas

Importa estilos

Gerencia estrutura base da aplicação

5.2 main.jsx

Ponto de entrada do React:
ReactDOM.createRoot(...).render(<App />)

5.3 routes.jsx

Define rotas:

/               → Home
/operator       → OperatorView
/projection     → ProjectionView

🛠 6. Configurações de Build
6.1 package.json

Define scripts dist:win, dist:linux, dist:mac

Configuração do electron-builder

Define AppID e ícones

6.2 tailwind.config.js

Configura estilos Tailwind usados em partes do app.

6.3 postcss.config.js

Usado para processar o CSS final.

📤 7. Pasta release/

Local onde electron-builder coloca:

.exe

.AppImage

.deb

.dmg

.zip

📝 8. Fluxos Internos do Aplicativo
8.1 Fluxo Operador → Projeção
OperatorView.jsx
    ↓ (IPC setPreview)
main.cjs
    ↓
ProjectionView.jsx  (preview)

8.2 Fluxo Live (modo de projeção ao vivo)
OperatorView.jsx
    ↓ (IPC sendLive)
main.cjs
    ↓
ProjectionView.jsx  (texto exibido ao público)

8.3 Fluxo de controle de tela cheia
OperatorView.jsx
    ↓ missalAPI.toggleFullscreen
preload.js
    ↓ IPC projection-toggle-fullscreen
main.cjs
    ↓ projectionWin.setFullScreen(...)

8.4 Fluxo de alternância de bordas

Idêntico ao fullscreen, MAS recriando janela.
