// electron-main.cjs (versão estável B)
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let operatorWindow = null;
let projectionWindow = null;

/* ============================================================
   MAIN WINDOW
============================================================ */
function createMainWindow() {
    if (mainWindow) return;

    mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'electron', 'preload.js'),
            contextIsolation: true
        }
    });

    // Vite default dev server
    mainWindow.loadURL('http://localhost:5173/');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/* ============================================================
   OPERATOR WINDOW
============================================================ */
function createOperatorWindow() {
    if (operatorWindow) {
        operatorWindow.show();
        operatorWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    const primary = displays[0];

    operatorWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        x: primary.bounds.x + 40,
        y: primary.bounds.y + 40,
        webPreferences: {
            preload: path.join(__dirname, 'electron', 'preload.js'),
            contextIsolation: true
        }
    });

    operatorWindow.loadURL('http://localhost:5173/#/operator');

    operatorWindow.on('closed', () => {
        // Fecha a projeção junto
        if (projectionWindow && !projectionWindow.isDestroyed()) {
            try {
                projectionWindow.destroy();   // fecha mesmo se estiver carregando
            } catch (e) {
                console.warn("Erro ao destruir projeção:", e);
            }
        }

        projectionWindow = null;
        operatorWindow = null;
    });
}

/* ============================================================
   PROJECTION WINDOW
============================================================ */
function createProjectionWindow() {
    if (projectionWindow) {
        projectionWindow.show();
        projectionWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    const projDisplay = displays[1] || displays[0];

    projectionWindow = new BrowserWindow({
        x: projDisplay.bounds.x,
        y: projDisplay.bounds.y,
        width: projDisplay.bounds.width,
        height: projDisplay.bounds.height,
        backgroundColor: '#000',
        webPreferences: {
            preload: path.join(__dirname, 'electron', 'preload.js'),
            contextIsolation: true
        },
        fullscreen: !!displays[1],
        frame: false
    });

    projectionWindow.loadURL('http://localhost:5173/#/projection');

    projectionWindow.on('closed', () => {
        projectionWindow = null;
    });
}

/* ============================================================
   IPC — OPEN OPERATOR + PROJECTION + LOAD LIST
============================================================ */
ipcMain.on('open-operator-and-projection', (e, flatList) => {
    createOperatorWindow();
    createProjectionWindow();

    const sendList = () => {
        if (operatorWindow && !operatorWindow.isDestroyed()) {
            operatorWindow.webContents.send('load-song-list', flatList || []);
        }
    };

    // Sempre esperar o load REAL  
    operatorWindow.webContents.once('did-finish-load', () => {
        setTimeout(sendList, 150); // atraso leve = estabiliza React Router + Vite
    });
});

/* ============================================================
   IPC — PREVIEW ONLY
============================================================ */
ipcMain.on('operator-set-preview', (e, data) => {
    operatorWindow?.webContents.send('update-preview', data);
});

/* ============================================================
   IPC — LIVE (ENVIAR PARA OPERATOR + PROJECTION)
============================================================ */
ipcMain.on('operator-send-live', (e, data) => {
    operatorWindow?.webContents.send('update-live', data);
    projectionWindow?.webContents.send('update-live', data);
});

/* ============================================================
   IPC — LOAD FILE FOR PROJECTION
============================================================ */
ipcMain.on('projection-load-file', (e, fileUrl) => {
    projectionWindow?.webContents.send('load-file', fileUrl);
});

/* ============================================================
   APP EVENTS
============================================================ */
app.whenReady().then(() => {
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
