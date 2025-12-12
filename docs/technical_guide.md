docs/technical_guide.md
# Guia Técnico Avançado – Missal Planner

Este documento descreve em profundidade o funcionamento interno do Missal Planner, com foco em:
- arquitetura
- integração React + Electron
- IPC e comunicação entre janelas
- sistema de projeção
- moldura azul e paginação
- persistência de arquivos
- build multiplataforma

---

# 1. Arquitetura Geral

O Missal Planner é composto por três pilares:

1. **Frontend React (Vite)**  
   Interface principal, lógica da projeção, edição e operador.

2. **Backend Electron (main.cjs)**  
   Gerencia:
   - janelas  
   - fullscreen  
   - alterações de borda (frameless <-> framed)  
   - seleção de monitor  
   - IPCs  
   - persistência em disco dos textos

3. **Preload (preload.js)**  
   Canal seguro de comunicação via `contextBridge` entre o renderer React e o processo principal.

---

# 2. Processo Principal (Electron)

O arquivo `electron/main.cjs` controla:

## 2.1 Criação das janelas

- **mainWin** → menu inicial  
- **operatorWin** → painel de controle do operador  
- **projectionWin** → tela de projeção exibida no segundo monitor  

O projeto usa uma arquitetura *sempre recriar quando necessário*, especialmente na alternância de bordas:

```js
createOrReplaceProjectionWindow(targetDisplay, { frameless, fullscreen });


Isso é necessário porque Electron não permite alterar dinamicamente:

frame: true/false

titlebarStyle

3. Comunicação via IPC

O preload expõe a API:

window.missalAPI = {
  setPreview(),
  sendLive(),
  openOnDisplay(),
  toggleFullscreen(),
  toggleBorder(),
  getDisplays(),
  ...
}


O operador envia:

preview

estado da moldura

zoom

página atual

O projectionView recebe e reflete pixel-perfect o que o operador envia.

4. Sistema de Paginação e Moldura Azul

O texto é dividido em páginas com base em:

altura_do_container / (lineHeight * fontScale)


Isso gera um número estável de linhas por página.

A moldura azul funciona com duas interações:

Drag (mover)

Resize inferior

Ambas atualizam:

top

height

preview

live (se ativo)

Cada página possui seu próprio estado persistido:

framesPerPage = {
  [pageIndex]: { top, height }
}


Ao navegar, a moldura retorna para o mesmo local configurado para aquela página.

5. Fullscreen e alternância de borda

O botão único no operador alterna perfeitamente:

Fullscreen sem bordas (frameless + fullscreen)

Janela normal do Windows/macOS/Linux (frame: true)

Implementação via recriação da janela:

ipcMain.on("projection-toggle-border", () => {
   createOrReplaceProjectionWindow(display, { frameless:false })
});

6. Persistência dos textos

O Missal Planner salva cada canto em:

/userData/song_texts/<slug>.json


A função makeSlugFilename() evita conflitos.

7. Build Multiplataforma

O electron-builder gera:

Windows

NSIS installer

Ícones

Atualização automática (quando releases estiverem ativos)

Linux

.deb

.AppImage

macOS

.dmg / .zip

8. Fluxo completo da Projeção

Operador envia setPreview → Projeção mostra prévia.

Operador ativa sendLive → Projeção mostra live.

Ajustes de moldura e zoom refletem em tempo real.

Troca de página sincroniza a moldura.

Fullscreen e bordas podem ser alternados dinamicamente.

9. Segurança

contextIsolation: true

nodeIntegration: false

IPC restrito ao preload

Nada do renderer acessa APIs OS diretamente

10. Conclusão

O Missal Planner possui uma arquitetura sólida e extensível:

sistema de projeção altamente controlável

comunicação segura

interface operadora avançada

suporte a múltiplos monitores

multiplataforma completa

Desenvolvido para uso real em celebrações litúrgicas,
com foco em confiabilidade acima de tudo.


---

# ✅ **2. `architecture.md` – Arquitetura Documentada**

```md
# Arquitetura do Missal Planner

Este documento apresenta uma visão de alto nível da estrutura do projeto.

---

# 1. Camadas do Sistema

### 1. Interface (React)
- App.jsx controla rotas (Operator / Projection / Home)
- OperatorView e ProjectionView representam os modos usados durante celebrações
- Usa hooks intensivamente
- Zero acesso direto ao SO

### 2. Camada de Comunicação (preload.js)
- expõe APIs via `contextBridge`
- converte chamadas React → IPC → Electron

### 3. Processo Principal (main.cjs)
Responsável por:
- criar janelas
- fullscreen
- alternância de borda
- seleção de monitores
- atualizar textos salvos
- lançar atualizações

---

# 2. Fluxo Operacional



OperatorView → missalAPI → main.cjs → ProjectionWin


---

# 3. Estado distribuído

- Cada “página do canto” possui uma moldura armazenada
- Navegação troca frame_atual com frame_da_página

---

# 4. Renderização da projeção

ProjectionView recebe:

```json
{
  "text": "...",
  "fontScale": 1.2,
  "viewportTop": 120,
  "viewportHeight": 180
}


E aplica exatamente na tela.

5. Build e distribuição

Electron-builder combina:

pasta /dist (React build)

pasta /electron

Para gerar executáveis multiplataforma.

npm run dist

6. Atualização automática

Configuração padrão para GitHub Releases.


---

# ✅ **3. `operator_manual.md` – Manual do Operador**

```md
# Manual do Operador – Missal Planner

Este manual explica como operar o software durante uma missa.

---

# 1. Abrir o modo Operador + Projeção

No menu inicial, selecione:
**"Abrir Operador e Projeção"**

Duas janelas serão abertas:
- Painel Operador
- Tela de Projeção (para o segundo monitor)

---

# 2. Seleção de Monitor

No topo do painel:



Monitor: [1] [Abrir Projeção Fullscreen]


Selecione o monitor correto antes de abrir fullscreen.

---

# 3. Controles da Projeção

O botão principal alterna:

- **Tela sem borda (fullscreen verdadeiro)**
- **Mostrar borda da tela (janela normal)**

Uso:
- Durante a missa → fullscreen sem borda  
- Após a missa → janela com borda para arrastar

---

# 4. Moldura Azul

A moldura define **o trecho exibido na projeção**.

Você pode:
- arrastar verticalmente  
- redimensionar pela borda inferior  

Cada página possui molduras independentes.

---

# 5. Zoom

Alterar zoom muda:
- tamanho da fonte  
- número de linhas por página  

A paginação é recalculada.

---

# 6. Navegação entre páginas

Os botões:
- “Ir para página anterior”
- “Ir para página seguinte”

alteram tanto o operador quanto a projeção.

---

# 7. Projetar o canto

Botão:

**Projetar canto**

Enquanto ativo, tudo que você faz (zoom, moldura, navegação) aparece em tempo real para a assembleia.

---

# 8. Voltar ao início

Funcionalidade específica para cantos longos.

---
