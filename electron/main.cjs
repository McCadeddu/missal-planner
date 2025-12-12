/* ============================================================
 * main.cjs — Missal Planner (versão final consolidada)
 * Janela de projeção com alternância perfeita:
 *  - Fullscreen sem borda
 *  - Janela normal com borda verdadeira do Windows
 * ============================================================ */

const { app, BrowserWindow, ipcMain, shell, screen } = require("electron");
const path = require("path");
const fs = require("fs");

const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

log.transports.file.level = "info";
autoUpdater.logger = log;

/* ============================================================
 * Caminhos
 * ============================================================ */

const userDataDir = app.getPath("userData");
const listasPath = path.join(userDataDir, "listas-salvas.json");
const songTextsDir = path.join(userDataDir, "song_texts");

function ensureSongTextsDir() {
    if (!fs.existsSync(songTextsDir)) {
        fs.mkdirSync(songTextsDir, { recursive: true });
    }
}

/* ============================================================
 * Util — slug seguro
 * ============================================================ */

function makeSlugFilename({ numero = "", nome = "" } = {}) {
    numero = String(numero || "").trim();
    nome = String(nome || "").trim();

    const baseParts = [];
    if (numero) baseParts.push(numero);
    if (nome) baseParts.push(nome);

    let base = baseParts.join(" ").toLowerCase();

    let slug = base
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .replace(/^\-+|\-+$/g, "");

    if (!slug) slug = "canto-" + Date.now();
    return slug + ".json";
}

/* ============================================================
 * Referências das janelas
 * ============================================================ */

let mainWin = null;
let operatorWin = null;
let projectionWin = null;

/* ============================================================
 * FUNÇÃO CENTRAL — Criar/Recriar janela de projeção
 * (corrigida: janela com borda REAL do Windows)
 * ============================================================ */

function createOrReplaceProjectionWindow(targetDisplay = null, options = {}) {
    const { frameless = true, fullscreen = false, showWhenReady = true } = options;

    // Fechar janela anterior
    if (projectionWin && !projectionWin.isDestroyed()) {
        try { projectionWin.removeAllListeners(); projectionWin.close(); } catch { }
        projectionWin = null;
    }

    projectionWin = new BrowserWindow({
        width: 1280,
        height: 720,
        backgroundColor: "black",
        title: "Projeção",

        // CORREÇÃO:
        frame: !frameless,            // borda real quando frameless = false
        autoHideMenuBar: frameless,   // só oculta menu no modo sem borda

        fullscreenable: true,
        resizable: true,
        show: false,

        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    projectionWin.loadURL(
        `file://${path.join(__dirname, "../dist/index.html")}#/projection`
    );

    projectionWin.once("ready-to-show", () => {
        try {
            if (targetDisplay?.bounds) {
                projectionWin.setBounds({
                    x: targetDisplay.bounds.x,
                    y: targetDisplay.bounds.y,
                    width: targetDisplay.bounds.width,
                    height: targetDisplay.bounds.height
                });
            }
            if (showWhenReady) projectionWin.show();
            if (fullscreen) projectionWin.setFullScreen(true);
        } catch {
            if (showWhenReady) projectionWin.show();
        }
    });

    projectionWin.on("closed", () => {
        projectionWin = null;
    });

    return projectionWin;
}

/* ============================================================
 * Criar janela principal
 * ============================================================ */

function createMainWindow() {
    mainWin = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWin.loadFile(path.join(__dirname, "../dist/index.html"));

    mainWin.on("closed", () => (mainWin = null));
}

/* ============================================================
 * MENU DO APLICATIVO — inclui "Help → Procurar atualizações"
 * ============================================================ */

function createMenu() {

    const template = [
        {
            label: "Arquivo",
            submenu: [
                { role: "quit", label: "Sair" }
            ]
        },
        {
            label: "Ajuda",
            submenu: [
                {
                    label: "🔄 Procurar atualizações…",
                    click: async () => {
                        dialog.showMessageBox({
                            type: "info",
                            title: "Atualização",
                            message: "Verificando atualizações…",
                        });

                        try {
                            const result = await autoUpdater.checkForUpdatesAndNotify();

                            if (result?.updateInfo?.version) {
                                dialog.showMessageBox({
                                    type: "info",
                                    title: "Atualização encontrada",
                                    message: `Nova versão disponível: ${result.updateInfo.version}\n\nO download começará automaticamente.`,
                                });
                            } else {
                                dialog.showMessageBox({
                                    type: "info",
                                    title: "Sem atualizações",
                                    message: "Você já está usando a versão mais recente.",
                                });
                            }

                        } catch (err) {
                            dialog.showMessageBox({
                                type: "error",
                                title: "Erro ao buscar atualização",
                                message: String(err),
                            });
                        }
                    }
                },
                { type: "separator" },
                {
                    label: "Site do Missal Planner",
                    click: () => shell.openExternal("https://github.com/McCadeddu/missal-planner")
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/* ============================================================
 * Abrir operador + projeção inicial (proj. frameless)
 * ============================================================ */

function createOperatorAndProjection(songList = []) {
    operatorWin = new BrowserWindow({
        width: 1100,
        height: 800,
        backgroundColor: "#111",
        title: "Painel Operador",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    operatorWin.loadURL(
        `file://${path.join(__dirname, "../dist/index.html")}#/operator`
    );

    operatorWin.webContents.on("did-finish-load", () => {
        operatorWin.webContents.send("load-song-list", songList);
    });

    operatorWin.on("closed", () => {
        operatorWin = null;
        if (projectionWin && !projectionWin.isDestroyed()) projectionWin.close();
    });

    const displays = screen.getAllDisplays();
    const secondDisplay = displays[1] || displays[0];

    createOrReplaceProjectionWindow(secondDisplay, {
        frameless: true,
        fullscreen: false,
        showWhenReady: true
    });
}

/* ============================================================
 * Inicialização do app
 * ============================================================ */

app.whenReady().then(() => {
    ensureSongTextsDir();
    createMainWindow();
    createMenu();

    autoUpdater.checkForUpdates().catch(() => { });
    autoUpdater.checkForUpdatesAndNotify().catch(() => { });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

/* ============================================================
 * AUTOUPDATE — Eventos completos (CORRIGE atualização no Windows)
 * ============================================================ */

autoUpdater.on("checking-for-update", () => {
    log.info("AutoUpdater: verificando atualizações…");
});

autoUpdater.on("update-available", (info) => {
    log.info("AutoUpdater: nova versão encontrada:", info.version);

    // Envia para a interface (OperatorView)
    if (operatorWin) {
        operatorWin.webContents.send("update-available", info);
    }
});

autoUpdater.on("update-not-available", (info) => {
    log.info("AutoUpdater: nenhuma atualização disponível.");
});

autoUpdater.on("error", (err) => {
    log.error("AutoUpdater: erro:", err);
});

autoUpdater.on("download-progress", (p) => {
    const msg = `Baixando atualização: ${Math.floor(p.percent)}%`;
    log.info(msg);

    // se quiser mostrar na interface, podemos enviar:
    if (operatorWin) {
        operatorWin.webContents.send("update-progress", p);
    }
});

autoUpdater.on("update-downloaded", (info) => {
    log.info("AutoUpdater: atualização baixada. Instalando…");

    // Instala e fecha o app automaticamente
    autoUpdater.quitAndInstall();
});

/* ============================================================
 * IPC — Verificação manual de atualização (App.jsx)
 * ============================================================ */

ipcMain.handle("check-for-updates", async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        if (result?.updateInfo?.version) {
            return { found: true, version: result.updateInfo.version };
        }
        return { found: false };
    } catch (err) {
        return { found: false, error: err.message || String(err) };
    }
});

/* ============================================================
 * IPC — Preview e Live
 * ============================================================ */

ipcMain.on("open-operator-and-projection", (_, songList) => {
    createOperatorAndProjection(songList);
});

ipcMain.on("operator-set-preview", (_, data) => {
    projectionWin?.webContents.send("update-preview", data);
});

ipcMain.on("operator-send-live", (_, data) => {
    projectionWin?.webContents.send("update-live", data);
});

ipcMain.on("projection-toggle-overlay", () => {
    projectionWin?.webContents.send("projection-overlay-toggle");
});

/* ============================================================
 * IPC — Arquivos texto
 * ============================================================ */

ipcMain.handle("save-song-text-file", async (_, payload) => {
    try {
        ensureSongTextsDir();
        const filename = makeSlugFilename(payload);
        const filepath = path.join(songTextsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify({
            id: payload.id ?? null,
            numero: payload.numero ?? "",
            nome: payload.nome ?? "",
            fullText: payload.fullText ?? "",
            updatedAt: new Date().toISOString()
        }, null, 2));
        return { ok: true, filename, path: filepath };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle("load-song-text-file", async (_, query) => {
    try {
        ensureSongTextsDir();
        const filename = makeSlugFilename(query);
        const filepath = path.join(songTextsDir, filename);
        if (!fs.existsSync(filepath)) return { ok: false, error: "not-found" };
        const parsed = JSON.parse(fs.readFileSync(filepath));
        return { ok: true, fullText: parsed.fullText };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle("open-song-texts-folder", async () => {
    ensureSongTextsDir();
    await shell.openPath(songTextsDir);
    return { ok: true, path: songTextsDir };
});

/* ============================================================
 * IPC — Displays e Fullscreen
 * ============================================================ */

/* → OperatorView pede lista de monitores */
ipcMain.handle("projection-get-displays", () => {
    return screen.getAllDisplays().map((d, i) => ({
        id: i,
        name: `Monitor ${i + 1}`,
        bounds: d.bounds
    }));
});

/* → Abrir fullscreen no display selecionado */
ipcMain.on("projection-open-on-display", (_, displayIndex) => {
    const displays = screen.getAllDisplays();
    const target = displays[displayIndex] || displays[0];

    createOrReplaceProjectionWindow(target, {
        frameless: true,
        fullscreen: true,
        showWhenReady: true
    });
});

/* → Fullscreen puro (não usamos mais para alternar borda) */
ipcMain.on("projection-toggle-fullscreen", () => {
    if (!projectionWin) return;
    projectionWin.setFullScreen(!projectionWin.isFullScreen());
});

/* ============================================================
 * IPC — Alternar borda real do Windows (frame:true <-> frame:false)
 * ============================================================ */
ipcMain.on("projection-toggle-frame", () => {
    if (!projectionWin || projectionWin.isDestroyed()) return;

    const wasFull = projectionWin.isFullScreen();
    const oldBounds = projectionWin.getBounds();

    // Detectar se janela atual é frameless
    const isFramelessNow = !projectionWin.isMenuBarVisible();

    const displays = screen.getAllDisplays();
    const containing = displays.find((d) => {
        const b = d.bounds;
        return oldBounds.x >= b.x && oldBounds.x < b.x + b.width;
    }) || displays[0];

    // RECRIAR com frame invertido
    const newWindow = new BrowserWindow({
        width: oldBounds.width,
        height: oldBounds.height,
        x: oldBounds.x,
        y: oldBounds.y,
        frame: isFramelessNow ? true : false, // invertendo!
        backgroundColor: "black",
        autoHideMenuBar: true,
        fullscreenable: true,
        resizable: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    projectionWin.removeAllListeners();
    projectionWin.close();
    projectionWin = newWindow;

    projectionWin.loadURL(
        `file://${path.join(__dirname, "../dist/index.html")}#/projection`
    );

    projectionWin.once("ready-to-show", () => {
        projectionWin.show();
        projectionWin.focus();
    });
});

/* ============================================================
 * IPC — Verificar atualização manual (botão no OperatorView)
 * ============================================================ */

ipcMain.on("operator-check-update", async () => {
    try {
        const result = await autoUpdater.checkForUpdates();

        if (result?.updateInfo?.version) {
            operatorWin?.webContents.send("operator-check-update-response", {
                found: true,
                version: result.updateInfo.version
            });
        } else {
            operatorWin?.webContents.send("operator-check-update-response", {
                found: false
            });
        }
    } catch (err) {
        operatorWin?.webContents.send("operator-check-update-response", {
            found: false,
            error: err.message || String(err)
        });
    }
});

/* ============================================================
 * Encerrar
 * ============================================================ */

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
