/* ============================================================
   preload.js — Missal Planner
   Expondo APIs seguras via contextBridge
============================================================ */

const { contextBridge, ipcRenderer } = require("electron");

/* util para listeners (recebe callback(payload)) */
function makeListener(channel) {
    return (cb) => {
        const handler = (_, payload) => cb(payload);
        ipcRenderer.on(channel, handler);
        return () => ipcRenderer.removeListener(channel, handler);
    };
}

contextBridge.exposeInMainWorld("missalAPI", {

    /* ========================================================
       OPERAÇÃO PRINCIPAL (Operator + Projection)
    ======================================================== */
    openOperatorAndProjection: (songList) =>
        ipcRenderer.send("open-operator-and-projection", songList),

    /* Preview / Live */
    setPreview: (data) => ipcRenderer.send("operator-set-preview", data),
    onPreviewUpdate: makeListener("update-preview"),

    sendLive: (data) => ipcRenderer.send("operator-send-live", data),
    onLiveUpdate: makeListener("update-live"),

    onLoadSongList: makeListener("load-song-list"),

    /* Overlay */
    toggleProjectionOverlay: () =>
        ipcRenderer.send("projection-toggle-overlay"),
    onProjectionOverlayToggle: makeListener("projection-overlay-toggle"),

    /* ========================================================
       MONITORES E PROJEÇÃO
    ======================================================== */
    getDisplays: () => ipcRenderer.invoke("projection-get-displays"),
    openOnDisplay: (index) => ipcRenderer.send("projection-open-on-display", index),

    toggleFullscreen: () => ipcRenderer.send("projection-toggle-fullscreen"),
    toggleBorder: () => ipcRenderer.send("projection-toggle-border"),
    toggleFrame: () => ipcRenderer.send("projection-toggle-frame"),

    /* ========================================================
       TEXTOS DOS CANTOS (arquivos)
    ======================================================== */
    saveSongTextToFile: (payload) =>
        ipcRenderer.invoke("save-song-text-file", payload),

    loadSongTextFromFile: (query) =>
        ipcRenderer.invoke("load-song-text-file", query),

    openSongTextsFolder: () =>
        ipcRenderer.invoke("open-song-texts-folder"),

    /* Atualização App <-> Operator */
    updateSongText: (payload) =>
        ipcRenderer.send("song-text-update", payload),
    onSongTextUpdated: makeListener("song-text-updated"),

    /* ========================================================
       SALVAMENTO DE LISTAS (JSON interno do app)
    ======================================================== */
    saveListas: (listas) =>
        ipcRenderer.send("listas:save", listas),

    loadListas: () =>
        ipcRenderer.invoke("listas:load"),

    /* ========================================================
       AUTOUPDATE — expor comandos e eventos
    ======================================================== */

    /* → botão "Verificar atualizações" */
    checkForUpdates: () =>
        ipcRenderer.invoke("check-for-updates"),

    /* → avisar interface quando nova versão for encontrada */
    onUpdateAvailable: makeListener("update-available"),

    /* → progresso do download */
    onUpdateProgress: makeListener("update-progress"),

    /* → se quiser futuramente avisar quando terminar: */
    // onUpdateDownloaded: makeListener("update-downloaded"),

});
